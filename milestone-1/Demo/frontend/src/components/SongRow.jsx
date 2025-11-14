import React from 'react';

function SongRow({ title, subtitle, right, onClick, className = '' }) {
  return (
    <li
      onClick={onClick}
      className={`bg-gray-900 p-3 rounded-md grid grid-cols-2 items-center ${className}`}
    >
      <span className="truncate">{title}</span>
      <span className="text-gray-400 text-right truncate">{right ?? subtitle ?? ''}</span>
    </li>
  );
}

export default SongRow;
