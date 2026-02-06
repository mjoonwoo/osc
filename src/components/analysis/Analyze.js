import React, { useEffect, useState } from 'react';
import { gameSubject, initGame } from './Game';
import Board from './Board';
import { undo, redo } from './Game';
import { convertMove } from '../../hooks/analyzePosition';

function Analyze() {
  const [board, setBoard] = useState([]);
  const [isGameOver, setIsGameOver] = useState();
  const [result, setResult] = useState();
  const [analysis, setAnalysis] = useState(null);
  
  useEffect(() => {
    initGame();
    const subscribe = gameSubject.subscribe((game) => {
      setBoard(game.board)
      setIsGameOver(game.isGameOver)
      setResult(game.result)
      setAnalysis(game.analysis)
  });
    return () => subscribe.unsubscribe();
  }, []);

  return (
    <div>
      <div className="analysis">
        <p className="horizontal-text">
          Best Move:{' '}
          {analysis ? convertMove(analysis.move, board) : '...'}
        </p>
        <p className="horizontal-text">
          Evaluation:{' '}
          {analysis
            ? analysis.mate
              ? analysis.mate > 0
                ? `M${analysis.mate}`
                : `-M${-analysis.mate}`
              : analysis.eval
            : '...'}
        </p>
      </div>
      <div className="game-row">
        {isGameOver && <h2 className="vertical-text" style={{fontFamily: "Pretendard", fontWeight: "bold"}}>GAME OVER</h2>}
        <div className="board-container">
          <Board board={board} />
        </div>
        {result && <p className="vertical-text" style={{fontFamily: "Pretendard", fontWeight: "regular"}}>{result}</p>}
      </div>
      <div className='game-row'>
        <button className="move-button" onClick={undo}>
          {'<'}
        </button>
        <button className="move-button" onClick={redo}>
          {'>'}
        </button>
      </div>
    </div>
  );
}

export default Analyze;