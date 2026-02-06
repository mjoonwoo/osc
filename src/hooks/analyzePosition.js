import { Chess } from 'chess.js';
import { StockfishEngine } from '../worker/StockfishEngine';

let engineInstance = null;

function getEngine() {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}

export async function analyzePosition(fen, depth = 20) {
  /*
  const apiUrl = 'https://stockfish.online/api/s/v2.php';
  const params = new URLSearchParams();

  params.append('fen', fen);
  params.append('depth', '12');

  const queryString = params.toString();

  const finalUrl = `${apiUrl}?${queryString}`;

  try {
    const response = await fetch(finalUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
  */

  const engine = getEngine();
  const result = await engine.analyze(fen, depth);
  return {
    move: result.bestmove,
    eval: result.evaluation,
    mate: result.mate,
  };
}

export function convertMove(move, board) {
  // move: "e2e4", "e7e8q", "e2xe4" 또는 { from, to, promotion, capture, piece }
  // board: chess.board() 형태(8x8, rank8->rank1, 각 칸은 null 또는 {type, color})

  const isPromotionChar = (c) => !!c && 'qrbn'.includes(c.toLowerCase());
  const fileIndex = (f) => f.charCodeAt(0) - 97;
  const rankIndex = (r) => 8 - parseInt(r, 10);
  const idxToSquare = (r, c) => String.fromCharCode(97 + c) + (8 - r);

  function squareToIdx(sq) {
    return { r: rankIndex(sq[1]), c: fileIndex(sq[0]) };
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function pathClear(fr, fc, tr, tc) {
    const dr = Math.sign(tr - fr);
    const dc = Math.sign(tc - fc);
    let r = fr + dr;
    let c = fc + dc;
    while (r !== tr || c !== tc) {
      if (!inBounds(r, c)) return false;
      if (board[r] && board[r][c]) return false;
      r += dr; c += dc;
    }
    return true;
  }

  function canReach(fromSq, toSq, pieceType, color) {
    const fIdx = squareToIdx(fromSq);
    const tIdx = squareToIdx(toSq);
    const fr = fIdx.r, fc = fIdx.c, tr = tIdx.r, tc = tIdx.c;
    if (!inBounds(fr, fc) || !inBounds(tr, tc)) return false;

    const targetCell = board[tr] && board[tr][tc];
    if (targetCell && targetCell.color === color) return false;

    const dr = tr - fr;
    const dc = tc - fc;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);

    const p = pieceType.toLowerCase();
    if (p === 'n') return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    if (p === 'b') {
      if (adr !== adc || adr === 0) return false;
      return pathClear(fr, fc, tr, tc);
    }
    if (p === 'r') {
      if (!(dr === 0 || dc === 0)) return false;
      if (dr === 0 && dc === 0) return false;
      return pathClear(fr, fc, tr, tc);
    }
    if (p === 'q') {
      if (adr === adc && adr !== 0) return pathClear(fr, fc, tr, tc);
      if (dr === 0 && dc !== 0) return pathClear(fr, fc, tr, tc);
      if (dc === 0 && dr !== 0) return pathClear(fr, fc, tr, tc);
      return false;
    }
    if (p === 'k') return Math.max(adr, adc) === 1;
    if (p === 'p') {
      const forward = color === 'w' ? -1 : 1;
      if (adr === forward && adc === 1) {
        return !!(board[tr] && board[tr][tc] && board[tr][tc].color !== color);
      }
      if (adr === forward && dc === 0) {
        return !(board[tr] && board[tr][tc]);
      }
      const startRank = color === 'w' ? 6 : 1;
      if (fr === startRank && dr === forward * 2 && dc === 0) {
        const midR = fr + forward;
        if ((board[midR] && board[midR][fc]) || (board[tr] && board[tr][tc])) return false;
        return true;
      }
      return false;
    }
    return false;
  }

  // build FEN from board and active color
  function buildFEN(activeColor) {
    const ranks = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let fenRow = '';
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (!cell) {
          empty++;
        } else {
          if (empty > 0) { fenRow += empty; empty = 0; }
          const letter = cell.type;
          fenRow += cell.color === 'w' ? letter.toUpperCase() : letter.toLowerCase();
        }
      }
      if (empty > 0) fenRow += empty;
      ranks.push(fenRow);
    }
    const placement = ranks.join('/');
    // minimal FEN: no castling, no en-passant, zero counters
    return `${placement} ${activeColor} - - 0 1`;
  }

  // normalize move input
  let mv = null;
  if (typeof move === 'string') {
    let s = move.trim();
    const captureFlag = /x/i.test(s);
    s = s.replace(/x/i, '');
    s = s.replace('=', '');
    let promotion = null;
    if (s.length === 5 && isPromotionChar(s[4])) promotion = s[4].toLowerCase();
    const from = s.slice(0, 2);
    const to = s.slice(2, 4);
    mv = { from, to, promotion, capture: captureFlag };
  } else if (move && typeof move === 'object') {
    mv = {
      from: move.from,
      to: move.to,
      promotion: move.promotion || move.promo || null,
      capture: !!(move.capture || move.captured || move.isCapture),
      piece: move.piece || move.p || null
    };
  } else {
    return '';
  }

  const { from, to, promotion } = mv;
  let capture = !!mv.capture;

  // castling short-circuit
  if (from === 'e1' && to === 'g1') return 'O-O';
  if (from === 'e1' && to === 'c1') return 'O-O-O';
  if (from === 'e8' && to === 'g8') return 'O-O';
  if (from === 'e8' && to === 'c8') return 'O-O-O';

  // determine piece and color from board
  let piece = mv.piece || null;
  let color = null;
  if (board && from) {
    const fr = rankIndex(from[1]);
    const fc = fileIndex(from[0]);
    const cell = (board[fr] && board[fr][fc]) || null;
    if (cell) {
      piece = piece || cell.type;
      color = cell.color;
    }
  }

  // detect capture by inspecting target square if board provided
  if (board && to) {
    const tr = rankIndex(to[1]);
    const tc = fileIndex(to[0]);
    const targetCell = (board[tr] && board[tr][tc]) || null;
    if (targetCell) capture = true;
  }

  const pieceMap = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
  const pieceLetter = piece ? (pieceMap[piece.toLowerCase()] ?? '') : '';
  const promoPart = promotion ? `=${promotion.toUpperCase()}` : '';

  // pawn moves
  if (!piece || piece.toLowerCase() === 'p') {
    const basePawn = capture ? `${from[0]}x${to}${promoPart}` : `${to}${promoPart}`;

    // simulate move to check for check/checkmate
    let suffix = '';
    try {
      const active = color || 'w';
      const fen = buildFEN(active);
      const ch = new Chess();
      if (!ch.load) { /* fallback */ }
      ch.load(fen);
      const mvObj = { from, to };
      if (promotion) mvObj.promotion = promotion;
      const res = ch.move(mvObj);
      if (res) {
        const isMate = (typeof ch.in_checkmate === 'function') ? ch.in_checkmate() : (typeof ch.isCheckmate === 'function' ? ch.isCheckmate() : false);
        const isCheck = (typeof ch.in_check === 'function') ? ch.in_check() : (typeof ch.isCheck === 'function' ? ch.isCheck() : false);
        if (isMate) suffix = '#';
        else if (isCheck) suffix = '+';
      }
    } catch (e) { /* ignore simulation errors */ }

    return basePawn + suffix;
  }

  // disambiguation: only include other pieces that can legally move to target
  let disambiguation = '';
  if (board && from && piece) {
    const colorOfPiece = color;
    const candidates = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (!cell) continue;
        if (cell.type === piece.toLowerCase() && cell.color === colorOfPiece) {
          const sq = idxToSquare(r, c);
          if (sq !== from && canReach(sq, to, cell.type, colorOfPiece)) candidates.push(sq);
        }
      }
    }
    if (candidates.length > 0) {
      const sameFile = candidates.some(sq => sq[0] === from[0]);
      const sameRank = candidates.some(sq => sq[1] === from[1]);
      if (!sameFile) disambiguation = from[0];
      else if (!sameRank) disambiguation = from[1];
      else disambiguation = from;
    }
  }

  const captureChar = capture ? 'x' : '';
  const base = `${pieceLetter}${disambiguation}${captureChar}${to}${promoPart}`;

  // simulate move for check/checkmate suffix
  let suffix = '';
  try {
    const active = color || 'w';
    const fen = buildFEN(active);
    const ch = new Chess();
    ch.load(fen);
    const mvObj = { from, to };
    if (promotion) mvObj.promotion = promotion;
    const res = ch.move(mvObj);
    if (res) {
      const isMate = (typeof ch.in_checkmate === 'function') ? ch.in_checkmate() : (typeof ch.isCheckmate === 'function' ? ch.isCheckmate() : false);
      const isCheck = (typeof ch.in_check === 'function') ? ch.in_check() : (typeof ch.isCheck === 'function' ? ch.isCheck() : false);
      if (isMate) suffix = '#';
      else if (isCheck) suffix = '+';
    }
  } catch (e) { /* ignore simulation errors */ }

  return base + suffix;
}
