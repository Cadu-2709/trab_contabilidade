// server.js
const express = require('express');
const cors = require('cors');
const queries = require('./queries');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Contábil está no ar!');
});

app.get('/plano-de-contas', async (req, res) => {
    try {
        const planoDeContas = await queries.getPlanoDeContas();
        res.status(200).json(planoDeContas);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar o plano de contas.');
    }
});

app.post('/lancamentos', async (req, res) => {
    const { data, historico, partidas } = req.body;
    if (!data || !historico || !partidas || !Array.isArray(partidas) || partidas.length < 2) {
        return res.status(400).json({ error: 'Dados inválidos.' });
    }
    let totalDebitos = 0;
    let totalCreditos = 0;
    for(const p of partidas) {
        const valor = parseFloat(p.valor);
        if (isNaN(valor) || valor <= 0 || !p.id_conta || !['D', 'C'].includes(p.tipo_partida.toUpperCase())) {
            return res.status(400).json({ error: 'Partida inválida.' });
        }
        if (p.tipo_partida.toUpperCase() === 'D') {
            totalDebitos += valor;
        } else {
            totalCreditos += valor;
        }
    }
    if (Math.abs(totalDebitos - totalCreditos) > 0.001) {
        return res.status(400).json({ error: 'A soma dos débitos não é igual à soma dos créditos.' });
    }
    try {
        const novoLancamento = await queries.createLancamento(req.body);
        res.status(201).json(novoLancamento);
    } catch (error) {
        console.error('Erro ao criar lançamento:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar o lançamento.', details: error.message });
    }
});

// --- NOVA ROTA PARA O BALANCETE ---
app.get('/relatorios/balancete', async (req, res) => {
    try {
        const balanceteData = await queries.getBalancete();
        res.status(200).json(balanceteData);
    } catch (error) {
        console.error('Erro ao gerar balancete:', error);
        res.status(500).json({ error: 'Erro ao gerar balancete.' });
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});