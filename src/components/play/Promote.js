import React from 'react'
import Square from './Square';
import { move } from './Game'

const promotionPieces = ['q', 'r', 'b', 'n'];

function Promote({ promotion }) {
  return (
    <div className='board'>
      {promotionPieces.map((p, i) => (
        <div key={i} className='promote-square'>
          <Square black={ i % 3 === 0 }>
            <div className='piece-container' onClick={() => move(promotion.from, promotion.to, p)}>
              <img src={require(`../../assets/piece/cburnett/${promotion.color}${p.toUpperCase()}.svg`)} alt="" className="piece cursor-pointer" />
            </div>
          </Square>
        </div>
      ))}
    </div>
  )
}

export default Promote