import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SongRow from '../components/SongRow';
import MainCard from '../components/MainCard';

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
    <MainCard
      title="Artist Followers: Who Has More?"
      headerRight={
        <div className="text-right">
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-2xl font-semibold">{score}</div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {/* use SongRow to display the followers line for consistency with list rows */}
            <ul className="mt-2">
              <SongRow
                title={a.revealed ? a.followers.toLocaleString() : '???'}
                subtitle=""
              />
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        {message && <div className="mb-3 text-lg">{message}</div>}
      </div>
    </MainCard>
  );
}

export default F4ArtistGuess;
