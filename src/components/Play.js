import React, { useEffect, useState } from 'react';
import { gameSubject, initGame } from './Game';
import Board from './Board';

function Analyze() {
  const [board, setBoard] = useState([]);
  const [isGameOver, setIsGameOver] = useState();
  const [result, setResult] = useState();
  
  useEffect(() => {
    initGame();
    const subscribe = gameSubject.subscribe((game) => {
      setBoard(game.board)
      setIsGameOver(game.isGameOver)
      setResult(game.result)
  });
    return () => subscribe.unsubscribe();
  }, [])

  return (
    <div>
      <div className="game-row">
        {isGameOver && <h2 className="vertical-text">GAME OVER</h2>}
        <div className="board-container">
          <Board board={board} />
        </div>
        {result && <p className="vertical-text">{result}</p>}
      </div>
    </div>
  );
}

export default Analyze;