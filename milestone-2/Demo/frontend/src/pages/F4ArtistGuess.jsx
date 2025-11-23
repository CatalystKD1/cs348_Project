import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SongRow from '../components/SongRow';
import MainCard from '../components/MainCard';
import { useUserContext } from '../lib/AuthProvider';

function F4ArtistGuess() {
  const { user } = useUserContext();
  const [pair, setPair] = useState([]);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const saved = Number(localStorage.getItem('topScore') || 0);
    setTopScore(saved);
  }, []);

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

  const addTopScore = async (score) => {
    try {
      await axios.post('http://localhost:3000/user/topscore', {
        username: user.username,
        score,
      });

    } catch (err) {
      console.error('Failed to add top score', err);
      setPair([]);
    }
  }

  const getTopScore = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.username}/topscore`);
      setTopScore(res.data.top_score || 0);
    } catch (err) {
      console.error('Failed to get top score', err);
    }
  };

  useEffect(() => {
    loadPair();
    getTopScore();
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

      setTimeout(() => {
        loadPair();
      }, 1500);

    } else if (clicked.followers === other.followers) {
      setMessage("Tie");

      setTimeout(() => {
        loadPair();
      }, 1500);

    } else {
      setMessage('Wrong');

      if (score > topScore) {
        addTopScore(score);
        setTopScore(score);
      }

      setShowPopup(true);
    }
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
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center w-72 border border-gray-700">
            <h2 className="text-2xl font-bold mb-3 text-white">Game Over</h2>

            <p className="text-lg text-gray-300 mb-1">
              Your Score: <span className="font-bold">{score}</span>
            </p>

            <p className="text-lg text-gray-300 mb-5">
              Top Score: <span className="font-bold">{topScore}</span>
            </p>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              onClick={() => {
                setShowPopup(false);
                setScore(0);
                loadPair();
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
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
