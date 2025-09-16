// src/App.jsx
import React from 'react';
import LancamentoForm from './components/LancamentoForm.jsx';
import Balancete from './components/Balancete.jsx';
import RelatoriosEspecificos from './components/RelatoriosEspecificos.jsx';

function App() {
  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
      <LancamentoForm />
      <hr style={{ margin: '40px 0', border: '1px solid #eee' }} />
      <Balancete />
      <hr style={{ margin: '40px 0', border: '1px solid #eee' }} />
      <RelatoriosEspecificos />
    </div>
  );
}

export default App;