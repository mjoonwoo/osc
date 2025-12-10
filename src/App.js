import React from 'react';
import './App.css';
import Analyze from './components/Analyze';
import Play from './components/Play';
import { Header } from './components/Header';

function App() {
  const [tab, setTab] = React.useState('analysis');

  return (
    <>
      <Header onTabChange={setTab} />
      <div className='container'>
        {tab === 'analysis' && <Analyze />}
        {tab === 'play' && <Play />}
      </div>
    </>
  );
}

export default App;