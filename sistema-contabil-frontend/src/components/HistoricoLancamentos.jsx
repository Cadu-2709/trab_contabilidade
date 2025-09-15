// src/components/HistoricoLancamentos.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HistoricoLancamentos = ({ novoLancamento }) => {
  const [lancamentos, setLancamentos] = useState([]);
  const [error, setError] = useState('');

  const fetchLancamentos = async () => {
    try {
      const response = await axios.get('http://localhost:3001/lancamentos');
      setLancamentos(response.data);
    } catch (err) {
      setError('Falha ao buscar o histórico de lançamentos.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLancamentos();
  }, [novoLancamento]); // Recarrega o histórico sempre que um novo lançamento é feito

  if (error) {
    return <div style={{ color: 'red', marginTop: '20px' }}>{error}</div>;
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Histórico de Lançamentos</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {lancamentos.map((lanc) => (
          <div key={lanc.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>Data: {new Date(lanc.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</strong>
              <span>Lançamento #{lanc.id}</span>
            </div>
            <p><strong>Histórico:</strong> {lanc.historico}</p>
            <div>
              {lanc.partidas.map((partida) => (
                <div key={partida.id} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', padding: '5px 0' }}>
                  <span>{partida.conta_codigo} - {partida.conta_nome}</span>
                  <span style={{ color: partida.tipo_partida === 'D' ? 'blue' : 'red', fontWeight: 'bold' }}>
                    {partida.tipo_partida === 'D' ? 'D' : 'C'} R$ {parseFloat(partida.valor).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricoLancamentos;