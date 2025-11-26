import React from 'react';

function MainCard({ title, headerRight, children, className = '' }) {
  return (
    <div className={`h-full bg-neutral-950 text-white flex flex-col items-center p-8 ${className}`}>
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        {headerRight && <div className="text-sm text-gray-400">{headerRight}</div>}
      </div>

      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );
}

export default MainCard;
