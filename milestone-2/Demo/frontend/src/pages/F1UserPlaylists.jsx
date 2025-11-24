import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MainCard from '../components/MainCard';
import SongsList from '../components/SongsList';
import SongRow from '../components/SongRow';

function F1UserPlaylists() {
  const [query, setQuery] = useState('');
  const [userResutls, setUserResults] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const autocompleteRef = useRef(null);

  const searchUsers = async (q) => {
    if (!q) return setUserResults([]);
    try {
      const res = await axios.get(`http://localhost:3000/users/search?q=${q}`);
      setUserResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setUserResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const fetchPlaylists = async (username) => {
    try {
      setError('');
      const res = await axios.get(`http://localhost:3000/user/${username}/playlists`);
      setPlaylists(res.data);
      console.log(res.data);
      setSongs([]);

      const diversityRes = await axios.get(`http://localhost:3000/user/${username}/playlists/diversity`);
      const diversityMap = {};
      for (const pl of diversityRes.data) {
        diversityMap[pl.playlist_id] = pl;
      }
      setPlaylists(prev => prev.map(p => ({ ...p, diversity: diversityMap[p.playlist_id] || null })));
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
      console.log(res.data);
    } catch (err) {
      setError('Could not load songs for this playlist.');
      setSongs([]);
    }
  };



  return (
    <MainCard title="User Playlists">

      {/* Error popup */}
      {error && (
        <div className="mb-6 w-full max-w-lg bg-red-600 text-white px-4 py-2 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Search */}

      <div className="relative w-72 mb-6 " ref={autocompleteRef}>
        <input
          className="w-full p-2 rounded-md text-white"
          placeholder="Search user..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            searchUsers(e.target.value);
          }}
        />

        {userResutls.length > 0 && (
          <ul className="absolute w-full bg-gray-800 mt-1 rounded-md shadow-lg z-10">
            {userResutls.map(a => (
              <li
                key={a.user_id}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  fetchPlaylists(a.username); 
                  setQuery(a.username);         
                  setUserResults([]);           
                }}
              >
                {a.username}
              </li>
            ))}
          </ul>
        )}
      </div>


      {/* Playlists */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {playlists.map(pl => (
          <div
            key={pl.playlist_id}
            onClick={() => fetchSongs(pl.playlist_id)}
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition"
          >
            <h3 className="font-bold">{pl.playlist_name}</h3>
            {pl.diversity && (
              <p className="text-xs text-gray-400">
                {pl.diversity.diversity_level} ({pl.diversity.genre_diversity_score?.toFixed(2)})
              </p>
            )}
            <p className="text-sm text-gray-400">Click to view songs</p>
          </div>
        ))}
      </div>

      {/* Songs */}
      {songs.length > 0 && (
        <SongsList title="Songs">
          {songs.map((s, i) => (
            <SongRow key={i} title={s.song_name} subtitle={s.artist} songId={s.song_id} />
          ))}
        </SongsList>
      )}
    </MainCard>
  );
}

export default F1UserPlaylists;