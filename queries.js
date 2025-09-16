// queries.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'contabil',
  password: 'admin', // Sua senha
  port: 5433, // Sua porta
});

const getPlanoDeContas = async () => {
    const { rows } = await pool.query('SELECT * FROM contas ORDER BY codigo');
    const contasMap = new Map();
    const contasRaiz = [];
    rows.forEach(conta => {
        conta.filhas = [];
        contasMap.set(conta.id, conta);
    });
    rows.forEach(conta => {
        if (conta.id_pai) {
            const pai = contasMap.get(conta.id_pai);
            if (pai) {
                pai.filhas.push(conta);
            }
        } else {
            contasRaiz.push(conta);
        }
    });
    return contasRaiz;
};

const createLancamento = async (lancamento) => {
    const { data, historico, partidas } = lancamento;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const lancamentoQuery = 'INSERT INTO lancamentos(data, historico) VALUES($1, $2) RETURNING id';
        const resLancamento = await client.query(lancamentoQuery, [data, historico]);
        const novoLancamentoId = resLancamento.rows[0].id;
        const partidaQuery = 'INSERT INTO partidas(id_lancamento, id_conta, tipo_partida, valor) VALUES($1, $2, $3, $4)';
        for (const partida of partidas) {
            const contaResult = await client.query('SELECT tipo FROM contas WHERE id = $1', [partida.id_conta]);
            if (contaResult.rows.length === 0 || contaResult.rows[0].tipo !== 'ANALITICA') {
                throw new Error(`A conta com ID ${partida.id_conta} não é uma conta analítica ou não existe.`);
            }
            await client.query(partidaQuery, [novoLancamentoId, partida.id_conta, partida.tipo_partida.toUpperCase(), partida.valor]);
        }
        await client.query('COMMIT');
        return { id: novoLancamentoId, message: 'Lançamento criado com sucesso!' };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getBalancete = async () => {
  const query = `
    SELECT
      c.codigo,
      c.nome,
      c.natureza,
      SUM(CASE WHEN p.tipo_partida = 'D' THEN p.valor ELSE 0 END) as total_debitos,
      SUM(CASE WHEN p.tipo_partida = 'C' THEN p.valor ELSE 0 END) as total_creditos
    FROM contas c
    JOIN partidas p ON c.id = p.id_conta
    GROUP BY c.id, c.codigo, c.nome, c.natureza
    HAVING SUM(CASE WHEN p.tipo_partida = 'D' THEN p.valor ELSE 0 END) != SUM(CASE WHEN p.tipo_partida = 'C' THEN p.valor ELSE 0 END)
    ORDER BY c.codigo;
  `;
  const { rows } = await pool.query(query);
  const contasComSaldo = rows.map(conta => {
    const saldo = parseFloat(conta.total_debitos) - parseFloat(conta.total_creditos);
    let saldoDevedor = 0;
    let saldoCredor = 0;
    if (saldo > 0) {
      saldoDevedor = saldo;
    } else if (saldo < 0) {
      saldoCredor = -saldo;
    }
    return {
      codigo: conta.codigo,
      nome: conta.nome,
      saldoDevedor: saldoDevedor,
      saldoCredor: saldoCredor,
    };
  });
  return contasComSaldo;
};

const getMovimentoContaPorPeriodo = async (codigosContas, dataInicio, dataFim) => {
  const query = `
    SELECT
      c.codigo,
      c.nome,
      SUM(CASE WHEN p.tipo_partida = 'D' THEN p.valor ELSE 0 END) as total_debitos,
      SUM(CASE WHEN p.tipo_partida = 'C' THEN p.valor ELSE 0 END) as total_creditos
    FROM partidas p
    JOIN lancamentos l ON p.id_lancamento = l.id
    JOIN contas c ON p.id_conta = c.id
    WHERE
      c.codigo = ANY($1::varchar[]) AND
      l.data BETWEEN $2 AND $3
    GROUP BY c.codigo, c.nome;
  `;
  const { rows } = await pool.query(query, [codigosContas, dataInicio, dataFim]);
  return rows;
};

const getDetalheContaPorPeriodo = async (codigosContas, dataInicio, dataFim) => {
  const query = `
    SELECT
      l.data,
      l.historico,
      p.valor,
      p.tipo_partida,
      c.nome as nome_conta
    FROM lancamentos l
    JOIN partidas p ON l.id = p.id_lancamento
    JOIN contas c ON p.id_conta = c.id
    WHERE
      c.codigo = ANY($1::varchar[]) AND
      l.data BETWEEN $2 AND $3
    ORDER BY l.data;
  `;
  const { rows } = await pool.query(query, [codigosContas, dataInicio, dataFim]);
  return rows;
};

module.exports = {
    getPlanoDeContas,
    createLancamento,
    getBalancete,
    getMovimentoContaPorPeriodo,
    getDetalheContaPorPeriodo,
};