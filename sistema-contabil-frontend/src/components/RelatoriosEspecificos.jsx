// src/components/RelatoriosEspecificos.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RelatoriosEspecificos = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('2.1.2.01');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0, 10));
  const [relatorioData, setRelatorioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const relatorioRef = useRef(null);

  const relatoriosMap = {
    '2.1.2.01': { nome: 'Salários a Pagar', tipoMovimento: 'C' },
    '2.1.2.05': { nome: 'FGTS a Recolher', tipoMovimento: 'C' },
    '2.1.2.04': { nome: 'INSS a Recolher', tipoMovimento: 'C' },
    '2.1.2.03': { nome: '13º Salário a Pagar', tipoMovimento: 'C' },
    'folha-total': { nome: 'Total Folha de Pagamento', tipoMovimento: 'C', codigos: ['2.1.2.01', '2.1.2.05', '2.1.2.04', '2.1.2.03'] },
    '2.1.3.03': { nome: 'PIS a Recolher', tipoMovimento: 'C' },
  };

  const gerarRelatorio = async () => {
    setLoading(true);
    setError('');
    setRelatorioData(null);

    const relatorioInfo = relatoriosMap[tipoRelatorio];
    const codigos = relatorioInfo.codigos || [tipoRelatorio];

    try {
      const response = await axios.get('http://localhost:3001/relatorios/detalhe-conta', {
        params: {
          codigos: codigos.join(','),
          dataInicio,
          dataFim,
        }
      });

      const transacoes = response.data.filter(t => t.tipo_partida === relatorioInfo.tipoMovimento);
      const total = transacoes.reduce((acc, transacao) => acc + parseFloat(transacao.valor), 0);
      
      setRelatorioData({
        nome: relatorioInfo.nome,
        total: total,
        periodo: `${new Date(dataInicio).toLocaleDateString('pt-BR',{timeZone:'UTC'})} a ${new Date(dataFim).toLocaleDateString('pt-BR',{timeZone:'UTC'})}`,
        transacoes: transacoes
      });

    } catch (err) {
      setError('Falha ao gerar o relatório.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = () => {
    const input = relatorioRef.current;
    if (!input) return;
    html2canvas(input, { scale: 2, backgroundColor: '#ffffff' })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = canvas.width / canvas.height;
        const pdfHeight = pdfWidth / ratio;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`relatorio-${tipoRelatorio}-${dataFim}.pdf`);
      });
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Relatórios Específicos por Período</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <label htmlFor="dataInicio">De:</label><br/>
          <input type="date" id="dataInicio" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <div>
          <label htmlFor="dataFim">Até:</label><br/>
          <input type="date" id="dataFim" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ padding: '8px' }} />
        </div>
        <div>
          <label htmlFor="tipoRelatorio">Relatório:</label><br/>
          <select id="tipoRelatorio" value={tipoRelatorio} onChange={e => setTipoRelatorio(e.target.value)} style={{ padding: '8px', minWidth: '250px' }}>
            <optgroup label="Folha de Pagamento">
              <option value="2.1.2.01">Salários</option>
              <option value="2.1.2.05">FGTS</option>
              <option value="2.1.2.04">INSS</option>
              <option value="2.1.2.03">Décimo Terceiro</option>
              <option value="folha-total">TOTAL Folha Pagamento</option>
            </optgroup>
            <optgroup label="Impostos">
              <option value="2.1.3.03">PIS</option>
            </optgroup>
          </select>
        </div>
        <button onClick={gerarRelatorio} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', alignSelf: 'flex-end' }}>
          {loading ? 'Gerando...' : 'Gerar'}
        </button>
        {relatorioData && (
          <button onClick={gerarPDF} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#AA1010', color: 'white', border: 'none', alignSelf: 'flex-end' }}>
            Gerar PDF
          </button>
        )}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {relatorioData && (
        <div ref={relatorioRef} style={{ background: 'white', padding: '15px', border: '1px solid #ccc' }}>
          <h3 style={{marginTop: 0, color: 'black'}}>{relatorioData.nome}</h3>
          <p style={{color: 'black'}}>Período: {relatorioData.periodo}</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'black' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Data</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Histórico do Lançamento</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {relatorioData.transacoes.map((transacao, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(transacao.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{transacao.historico}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{parseFloat(transacao.valor).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <td colSpan="2" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Total no Período</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>R$ {relatorioData.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default RelatoriosEspecificos;