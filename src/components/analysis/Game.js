import { useEffect } from 'react';
import { Chess } from 'chess.js';
import { BehaviorSubject } from 'rxjs';
import { analyzePosition } from '../../hooks/analyzePosition';

// let promotion = 'rnbqk2r/ppppbpPp/4p3/8/8/5P2/PPPPP2P/RNBQKBNR w kq - 0 1'

const futureMoves = {moves: [], index: 0};

const chess = new Chess();

chess.setHeader('Event', 'Chess Analysis');

export const gameSubject = new BehaviorSubject({
  board: chess.board()
});

export function initGame() {
  updateGame();
}

export function handleMove(from, to) {
  const promotions = chess.moves({verbose: true}).filter(m => m.promotion);
  if (promotions.some(p => `${p.from}:${p.to}` === `${from}:${to}`)) {
    const pendingPromotion = { from, to , color: promotions[0].color };
    updateGame(pendingPromotion);
  }
  const {pendingPromotion} = gameSubject.getValue();
  if (!pendingPromotion) {
    move(from, to);
  }
}

export function move(from, to, promotion) {
  let tempMove = {from, to};
  if (promotion) {
    tempMove.promotion = promotion;
  }

  if (!from || !to) return false;

  const possible = chess.moves({ square: from, verbose: true }) || [];
  const isLegal = possible.some(m => m.to === to);
  if (!isLegal) return false;

  const legalMove = chess.move(tempMove);
  if (legalMove) {
    if (futureMoves.index < futureMoves.moves.length) {
      futureMoves.moves = futureMoves.moves.slice(0, futureMoves.index);
    }

    futureMoves.moves.push(tempMove);
    futureMoves.index = futureMoves.moves.length;
    updateGame();
    return true;
  }
}

export function undo() {
  const undone = chess.undo();
  if (undone) {
    futureMoves.index = Math.max(0, futureMoves.index - 1);
    updateGame();
    return true;
  }
  return false;
}

export function redo() {
  if (futureMoves.index < futureMoves.moves.length) {
    const mv = futureMoves.moves[futureMoves.index];
    chess.move(mv);
    futureMoves.index = Math.min(futureMoves.moves.length, futureMoves.index + 1);
    updateGame();
    return true;
  }
  return false;
}

function updateGame(pendingPromotion) {
  const isGameOver = chess.isGameOver();

  const baseGame = {
    board: chess.board(),
    pendingPromotion,
    isGameOver,
    result: isGameOver? getGameResult() : null
  }

  gameSubject.next(baseGame);

  analyzePosition(chess.fen())
    .then((data) => {
      gameSubject.next({
        ...baseGame,
        analysis: data
      });
    })
    .catch((err) => {
      console.error('analyzePosition failed:', err);
    });
}

function getGameResult() {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? 'BLACK' : 'WHITE'
    return `CHECKMATE - WINNER - ${winner}`
  } else if (chess.isDraw()) {
    let reason = '50 - MOVES - RULE'
    if (chess.isStalemate()) {
      reason = 'STALEMATE'
    } else if (chess.isThreefoldRepetition()) {
      reason = 'REPETITION'
    } else if (chess.isInsufficientMaterial()) {
      reason = 'INSUFFICIENT MATERIAL'
    }
    return `DRAW - ${reason}`
  } else {
    return 'UNKNOWN REASON'
  }
}

export function getFen() {
  return chess.fen();
}