import React from 'react';
import './App.css';
import Analyze from './components/analysis/Analyze';
import Play from './components/play/Play';
import { Header } from './components/Header';
import Footer from './components/Footer';

function App() {
  const [tab, setTab] = React.useState('analysis');

  return (
    <div className="App">
      <Header onTabChange={setTab} />
      <div className='container'>
        {tab === 'analysis' && <Analyze />}
        {tab === 'play' && <Play />}
      </div>
      <Footer />
    </div>
  );
}

export default App;