import React, { useEffect, useState } from 'react';
import axios from 'axios';

function F4ArtistGuess() {
  const [pair, setPair] = useState([]); 
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const loadPair = async () => {
    setMessage('');
    try {
      const res = await axios.get('http://localhost:3000/artists/random');
      const artists = res.data || [];
      setPair(artists);
    } catch (err) {
      console.error('Failed to fetch artists', err);
      setPair([]);
    } 
  };

  useEffect(() => {
    loadPair();
  }, []);

  const revealAndScore = (index) => {
    const otherIdx = index === 0 ? 1 : 0;
    const clicked = pair[index];
    const other = pair[otherIdx];

    const newPair = pair.map((p) => ({ ...p, revealed: true }));
    setPair(newPair);

    if (clicked.followers > other.followers) {
      setScore((s) => s + 1);
      setMessage('Correct');
    } else if (clicked.followers === other.followers) {
      setMessage("Tie");
    } else {
      setScore(0);
      setMessage('Wrong');
    }

    setTimeout(() => {
      loadPair();
    }, 1500);
  };

  return (
    <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Artist Followers: Who Has More?</h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-2xl font-semibold">{score}</div>
        </div>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {pair.map((a, idx) => (
          <div
            key={a.artist_id + '-' + idx}
            className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer transition"
            onClick={() => {
              if (!a.revealed) revealAndScore(idx);
            }}
          >
            <h3 className="text-xl font-semibold mb-2">{a.artist_name}</h3>
            <div className="text-gray-400">Followers</div>
            <div className="text-2xl font-bold">
              {a.revealed ? a.followers.toLocaleString() : '???'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        {message && <div className="mb-3 text-lg">{message}</div>}
      </div>
    </div>
  );
}

export default F4ArtistGuess;
