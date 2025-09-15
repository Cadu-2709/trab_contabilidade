// src/components/SeletorDeConta.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';

const SeletorDeConta = ({ planoDeContas, onContaSelecionada }) => {
  // O estado dos níveis agora começa vazio
  const [niveis, setNiveis] = useState([]);
  const [selecoes, setSelecoes] = useState([]);

  // --- MUDANÇA PRINCIPAL ---
  // Este useEffect "escuta" a propriedade planoDeContas.
  // Quando ela finalmente chega da API, ele inicia o primeiro nível do seletor.
  useEffect(() => {
    // Garante que só vamos popular os níveis se tivermos um plano de contas válido
    if (planoDeContas && planoDeContas.length > 0) {
      setNiveis([planoDeContas]);
      setSelecoes([]); // Reseta qualquer seleção anterior
    }
  }, [planoDeContas]); // A mágica acontece aqui: ele roda sempre que 'planoDeContas' mudar

  const handleSelect = (nivelIndex, contaId) => {
    const novasSelecoes = [...selecoes.slice(0, nivelIndex), contaId];
    let novosNiveis = [...niveis.slice(0, nivelIndex + 1)];

    // Se o usuário selecionou a opção "Selecione...", limpamos os próximos níveis
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
        // Remove os níveis seguintes se a seleção for analítica
        novosNiveis = [...niveis.slice(0, nivelIndex + 1)];
      } else if (contaSelecionada.filhas && contaSelecionada.filhas.length > 0) {
        novosNiveis.push(contaSelecionada.filhas);
        onContaSelecionada(null); // Reseta a seleção final se não for analítica
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
              {/* Adapta o texto para o primeiro nível */}
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