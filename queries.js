// queries.js
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados
const pool = new Pool({
  user: 'postgres',         // seu usuário do postgres
  host: 'localhost',
  database: 'contabil',  // o nome do seu banco de dados
  password: 'admin', // sua senha do postgres
  port: 5433,
});

const getPlanoDeContas = async () => {
    // ... (código existente, sem alterações)
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
    // ... (código existente, sem alterações)
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

// --- NOVA FUNÇÃO ADICIONADA ---
/**
 * Busca todos os lançamentos com suas partidas aninhadas.
 */
const getLancamentos = async () => {
  const query = `
    SELECT
      l.id,
      l.data,
      l.historico,
      json_agg(
        json_build_object(
          'id', p.id,
          'tipo_partida', p.tipo_partida,
          'valor', p.valor,
          'conta_id', p.id_conta,
          'conta_codigo', c.codigo,
          'conta_nome', c.nome
        ) ORDER BY p.tipo_partida DESC
      ) AS partidas
    FROM lancamentos l
    JOIN partidas p ON l.id = p.id_lancamento
    JOIN contas c ON p.id_conta = c.id
    GROUP BY l.id
    ORDER BY l.data DESC, l.id DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
    getPlanoDeContas,
    createLancamento,
    getLancamentos, // <-- Exporta a nova função
};