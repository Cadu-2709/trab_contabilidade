// src/components/Balancete.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Balancete = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const relatorioRef = useRef(null);

  const gerarRelatorio = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await axios.get('http://localhost:3001/relatorios/balancete');
      setData(response.data);
    } catch (err) {
      setError('Falha ao gerar o balancete. Verifique se existem lançamentos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = () => {
    const input = relatorioRef.current;
    if (!input) {
      return;
    }

    html2canvas(input, {
      scale: 2,
      backgroundColor: '#ffffff',
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const pdfHeight = pdfWidth / ratio;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`balancete-${new Date().toISOString().slice(0,10)}.pdf`);
      });
  };

  const renderTabela = (titulo, contas) => {
    if (!contas || contas.length === 0) return null;
    const totalDevedor = contas.reduce((acc, conta) => acc + conta.saldoDevedor, 0);
    const totalCredor = contas.reduce((acc, conta) => acc + conta.saldoCredor, 0);

    return (
      <div style={{ marginTop: '20px' }}>
        <h3>{titulo}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0', color: 'black' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', color: 'black' }}>Código</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', color: 'black' }}>Conta</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>Saldo Devedor (R$)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>Saldo Credor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.codigo}>
                <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black' }}>{conta.codigo}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black' }}>{conta.nome}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>
                  {conta.saldoDevedor > 0 ? conta.saldoDevedor.toFixed(2) : '-'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>
                  {conta.saldoCredor > 0 ? conta.saldoCredor.toFixed(2) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f0f0', fontWeight: 'bold', color: 'black' }}>
              <td colSpan="2" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>Total {titulo}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>{totalDevedor.toFixed(2)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', color: 'black' }}>{totalCredor.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const ativos = data ? data.filter(c => c.codigo.startsWith('1')) : [];
  const passivos = data ? data.filter(c => c.codigo.startsWith('2')) : [];
  const patrimonioLiquido = data ? data.filter(c => c.codigo.startsWith('3')) : [];
  
  let totalGeralDevedor = 0;
  let totalGeralCredor = 0;
  if(data) {
    totalGeralDevedor = data.reduce((acc, conta) => acc + conta.saldoDevedor, 0);
    totalGeralCredor = data.reduce((acc, conta) => acc + conta.saldoCredor, 0);
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Relatórios</h2>
      <div style={{display: 'flex', gap: '10px'}}>
        <button onClick={gerarRelatorio} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          {loading ? 'Gerando...' : 'Gerar Balancete'}
        </button>
        {data && (
            <button onClick={gerarPDF} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#AA1010', color: 'white', border: 'none' }}>
                Gerar PDF
            </button>
        )}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div ref={relatorioRef} style={{ background: 'white', padding: '10px' }}>
        {data && (
          <div style={{ marginTop: '20px', color:'#000000ff'}}>
            {renderTabela('Ativo', ativos)}
            {renderTabela('Passivo', passivos)}
            {renderTabela('Patrimônio Líquido', patrimonioLiquido)}
            <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '2px solid black' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.1em' }}>
                <tbody>
                  <tr style={{fontWeight: 'bold'}}>
                    <td style={{padding: '8px', textAlign: 'right', color:'#000000ff' }}>Total Geral</td>
                    <td style={{width: '130px', padding: '8px', textAlign: 'right', border: '1px solid #000000ff', color:'#000000ff' }}>{totalGeralDevedor.toFixed(2)}</td>
                    <td style={{width: '130px', padding: '8px', textAlign: 'right', border: '1px solid #000000ff', color:'#000000ff' }}>{totalGeralCredor.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              {Math.abs(totalGeralDevedor - totalGeralCredor) > 0.01 &&
                <p style={{color: 'red', textAlign: 'center', fontWeight: 'bold'}}>
                  Atenção: A soma dos saldos devedores não bate com a dos saldos credores!
                </p>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Balancete;