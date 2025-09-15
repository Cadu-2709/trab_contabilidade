// src/components/LancamentoForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SeletorDeConta from './SeletorDeConta.jsx'; // <-- Importa o novo componente

const LancamentoForm = () => {
  // ... (a maior parte dos states continua igual)
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState([
    { id_conta: null, tipo_partida: 'D', valor: '' },
    { id_conta: null, tipo_partida: 'C', valor: '' },
  ]);
  const [planoDeContas, setPlanoDeContas] = useState([]); // Agora vai guardar a árvore completa
  const [totalDebitos, setTotalDebitos] = useState(0);
  const [totalCreditos, setTotalCreditos] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchPlanoDeContas = async () => {
      try {
        const response = await axios.get('http://localhost:3001/plano-de-contas');
        setPlanoDeContas(response.data); // Armazena a árvore de contas
      } catch (error) {
        setErrorMessage('Erro ao buscar o plano de contas.');
        console.error(error);
      }
    };
    fetchPlanoDeContas();
  }, []);

  // ... (useEffect para totais, addPartida, removePartida e handleSubmit continuam iguais)
  useEffect(() => {
    let debitos = 0;
    let creditos = 0;
    partidas.forEach(p => {
      const valor = parseFloat(p.valor) || 0;
      if (p.tipo_partida === 'D') {
        debitos += valor;
      } else {
        creditos += valor;
      }
    });
    setTotalDebitos(debitos);
    setTotalCreditos(creditos);
  }, [partidas]);

  const handlePartidaChange = (index, field, value) => {
    const novasPartidas = [...partidas];
    novasPartidas[index][field] = value;
    setPartidas(novasPartidas);
  };

  const addPartida = () => {
    setPartidas([...partidas, { id_conta: null, tipo_partida: 'D', valor: '' }]);
  };

  const removePartida = (index) => {
    if (partidas.length <= 2) {
      setErrorMessage("Um lançamento deve ter no mínimo duas partidas.");
      return;
    }
    const novasPartidas = partidas.filter((_, i) => i !== index);
    setPartidas(novasPartidas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (partidas.some(p => !p.id_conta)) {
        setErrorMessage('Todas as partidas devem ter uma conta analítica selecionada.');
        return;
    }
    if (Math.abs(totalDebitos - totalCreditos) > 0.001 || totalDebitos === 0) {
      setErrorMessage('A soma dos débitos deve ser igual à soma dos créditos e maior que zero.');
      return;
    }
    const lancamento = { data, historico, partidas };
    try {
      await axios.post('http://localhost:3001/lancamentos', lancamento);
      setSuccessMessage('Lançamento criado com sucesso!');
      setHistorico('');
      setPartidas([
        { id_conta: null, tipo_partida: 'D', valor: '' },
        { id_conta: null, tipo_partida: 'C', valor: '' },
      ]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erro ao criar lançamento.';
      setErrorMessage(errorMsg);
      console.error(error);
    }
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <h1>Novo Lançamento Contábil</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Campos de Data e Histórico (sem alteração) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}><label>Data:</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} required style={{ width: '100%', padding: '8px' }}/></div>
          <div style={{ flex: 3 }}><label>Histórico:</label><input type="text" value={historico} onChange={(e) => setHistorico(e.target.value)} required style={{ width: '100%', padding: '8px' }} placeholder="Descreva o fato contábil"/></div>
        </div>
        
        <h3>Partidas</h3>
        {partidas.map((partida, index) => (
          <div key={index} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
            {/* NOVO SELETOR HIERÁRQUICO */}
            <SeletorDeConta 
              planoDeContas={planoDeContas}
              onContaSelecionada={(contaId) => handlePartidaChange(index, 'id_conta', contaId)}
            />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select value={partida.tipo_partida} onChange={(e) => handlePartidaChange(index, 'tipo_partida', e.target.value)} style={{ flex: 1, padding: '8px' }}>
                <option value="D">Débito</option>
                <option value="C">Crédito</option>
              </select>
              <input type="number" step="0.01" value={partida.valor} onChange={(e) => handlePartidaChange(index, 'valor', e.target.value)} required style={{ flex: 1, padding: '8px' }} placeholder="Valor"/>
              <button type="button" onClick={() => removePartida(index)} style={{ padding: '8px', background: '#ff4d4d', color: 'white', border: 'none', cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        ))}
        
        {/* Botões e Totais (sem alteração) */}
        <button type="button" onClick={addPartida} style={{ padding: '10px', alignSelf: 'flex-start' }}>Adicionar Partida</button>
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <strong>Total Débitos:</strong> R$ {totalDebitos.toFixed(2)}
            <strong style={{ marginLeft: '20px' }}>Total Créditos:</strong> R$ {totalCreditos.toFixed(2)}
            {Math.abs(totalDebitos - totalCreditos) > 0.001 && <span style={{ color: 'red', marginLeft: '20px' }}> (Diferença: R$ {(totalDebitos - totalCreditos).toFixed(2)})</span>}
        </div>
        {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
        {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
        <button type="submit" style={{ padding: '15px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Salvar Lançamento</button>
      </form>
    </div>
  );
};

export default LancamentoForm;