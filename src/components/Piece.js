import React from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';

function Piece({ piece: { type, color }, position }) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'piece',
    id: `${position}_${type}_${color}`,
    item: { type, color, fromPosition: position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const pieceImg = require(`../assets/piece/cburnett/${color}${type.toUpperCase()}.svg`);
  
  return (
    <>
      <DragPreviewImage connect={preview} src={pieceImg} />
      <div className="piece-container" ref={drag} style={{ opacity: isDragging ? 0 : 1 }}>
        <img src={pieceImg} alt="" className="piece" />
      </div>
    </>
  );
}

export default Piece;