// src/components/SeletorDeConta.jsx
import React, { useState, useEffect } from 'react';

const SeletorDeConta = ({ planoDeContas, onContaSelecionada }) => {
  const [niveis, setNiveis] = useState([]);
  const [selecoes, setSelecoes] = useState([]);

  useEffect(() => {
    if (planoDeContas && planoDeContas.length > 0) {
      setNiveis([planoDeContas]);
      setSelecoes([]);
    }
  }, [planoDeContas]);

  const handleSelect = (nivelIndex, contaId) => {
    const novasSelecoes = [...selecoes.slice(0, nivelIndex), contaId];
    let novosNiveis = [...niveis.slice(0, nivelIndex + 1)];

    if (!contaId) {
      setSelecoes(novasSelecoes.slice(0, nivelIndex));
      setNiveis(novosNiveis);
      onContaSelecionada(null);
      return;
    }

    const contaSelecionada = niveis[nivelIndex].find(c => c.id === parseInt(contaId));

    if (contaSelecionada) {
      if (contaSelecionada.tipo === 'ANALITICA') {
        onContaSelecionada(contaSelecionada.id);
        novosNiveis = [...niveis.slice(0, nivelIndex + 1)];
      } else if (contaSelecionada.filhas && contaSelecionada.filhas.length > 0) {
        novosNiveis.push(contaSelecionada.filhas);
        onContaSelecionada(null);
      }
    }
    
    setSelecoes(novasSelecoes);
    setNiveis(novosNiveis);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {niveis.map((opcoes, index) => (
        opcoes && opcoes.length > 0 && (
          <select
            key={index}
            value={selecoes[index] || ''}
            onChange={(e) => handleSelect(index, e.target.value)}
            style={{ padding: '8px', flexGrow: 1, minWidth: '150px' }}
          >
            <option value="">
              {index === 0 ? 'Selecione um Grupo...' : `Selecione o Nível ${index + 1}...`}
            </option>
            {opcoes.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        )
      ))}
    </div>
  );
};

export default SeletorDeConta;