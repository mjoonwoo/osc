import React from 'react';

function Piece({ piece: { type, color } }) {
  const pieceImg = require(`../public/piece/cburnett/${color}${type.toUpperCase()}.svg`);
  return (
    <div className="piece-container">
      <img src={pieceImg} alt="" className="piece" />
    </div>
);
}

export default Piece;