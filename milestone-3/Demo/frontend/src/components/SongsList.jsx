import React from 'react';

function SongsList({ children, title }) {
  return (
    <div className="mt-4 w-full max-w-2xl">
      {title && <h3 className="text-2xl mb-4">{title}</h3>}
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

export default SongsList;
