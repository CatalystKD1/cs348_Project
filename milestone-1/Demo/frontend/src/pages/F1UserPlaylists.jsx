import React, { useState } from 'react';
import axios from 'axios';

function F1UserPlaylists() {
  const [username, setUsername] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');

  const fetchPlaylists = async () => {
    try {
      setError('');
      const res = await axios.get(`http://localhost:3000/user/${username}/playlists`);
      setPlaylists(res.data);
      setSongs([]);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`User "${username}" not found.`);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setPlaylists([]);
      setSongs([]);
    }
  };

  const fetchSongs = async (pID) => {
    try {
      setError('');
      const res = await axios.get(`http://localhost:3000/playlist/${pID}/songs`);
      setSongs(res.data);
    } catch (err) {
      setError('Could not load songs for this playlist.');
      setSongs([]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-8 rounded-2xl">
      <h2 className="text-3xl font-bold mb-6">User Playlists</h2>

      {/* Error popup */}
      {error && (
        <div className="mb-6 w-full max-w-lg bg-red-600 text-white px-4 py-2 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex space-x-2 mb-8">
        <input
          className="p-2 rounded-md w-64 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button
          onClick={fetchPlaylists}
          className="bg-green-400 hover:bg-green-300 text-black font-semibold px-4 py-2 rounded-md"
        >
          Get Playlists
        </button>
      </div>

      {/* Playlists */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {playlists.map(pl => (
          <div
            key={pl.pID}
            onClick={() => fetchSongs(pl.playlist_id)}
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition"
          >
            <h3 className="font-bold">{pl.playlist_name}</h3>
            <p className="text-sm text-gray-400">Click to view songs</p>
          </div>
        ))}
      </div>

      {/* Songs */}
      {songs.length > 0 && (
        <div className="mt-10 w-full max-w-2xl">
          <h3 className="text-2xl mb-4">Songs</h3>
          <ul className="space-y-2">
            {songs.map((s, i) => (
              <li
                key={i}
                className="bg-gray-900 p-3 rounded-md flex justify-between"
              >
                <span>{s.song_name}</span>
                <span className="text-gray-400">{s.artist}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default F1UserPlaylists;