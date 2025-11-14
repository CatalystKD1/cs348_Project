import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../lib/AuthProvider';

function Profile() {
  const { user, isAuthenticated } = useUserContext();

  const [playlists, setPlaylists] = useState([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState({}); 
  const [expanded, setExpanded] = useState({}); 
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user || !user.username) return;
    loadPlaylists();
    loadLikes();
  }, [isAuthenticated, user.username]);

  const loadPlaylists = async () => {
    setError('');
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.username}/playlists`);
      setPlaylists(res.data || []);
      setFilteredPlaylists(res.data || []);
    } catch (err) {
      console.error('Failed to load playlists', err);
      setError('Could not load your playlists.');
      setPlaylists([]);
      setFilteredPlaylists([]);
    }
  };

  const loadLikes = async () => {
    setError('');
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.username}/likes`);
      console.log(res.data);
      if (Array.isArray(res.data)) setLikes(res.data);
      else setLikes([]);
    } catch (err) {
      console.error('Failed to load likes', err);
      setError('Could not load liked songs.');
      setLikes([]);
    }
  };

  const toggleExpand = async (playlistId) => {
    setExpanded(prev => ({ ...prev, [playlistId]: !prev[playlistId] }));

    if (!playlistSongs[playlistId] && !expanded[playlistId]) {
      try {
        const res = await axios.get(`http://localhost:3000/playlist/${playlistId}/songs`);
        setPlaylistSongs(prev => ({ ...prev, [playlistId]: res.data || [] }));
      } catch (err) {
        console.error('Failed to load playlist songs', err);
        setPlaylistSongs(prev => ({ ...prev, [playlistId]: [] }));
      }
    }
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (!q) return setFilteredPlaylists(playlists);
    const lower = q.trim().toLowerCase();
    setFilteredPlaylists(playlists.filter(p => (p.playlist_name || '').toLowerCase().includes(lower)));
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-6">Profile</h2>
        <div className="text-gray-400">You must be signed in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{user.username}'s Profile</h2>
        <div className="text-sm text-gray-400">Manage your playlists & likes</div>
      </div>

      {error && (
        <div className="mb-6 w-full max-w-lg bg-red-600 text-white px-4 py-2 rounded-md text-center">
          {error}
        </div>
      )}

      <div className="w-full max-w-3xl mb-6">
        <button
          onClick={() => setShowLikes(s => !s)}
          className="w-full text-left bg-gray-800 p-4 rounded-md hover:bg-gray-700 transition flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">Liked Songs</div>
            <div className="text-sm text-gray-400">{likes.length} songs</div>
          </div>
          <div className="text-gray-400">{showLikes ? '▴' : '▾'}</div>
        </button>

        {showLikes && (
          <div className="mt-3 bg-gray-900 rounded-md p-4">
            {likes.length === 0 ? (
              <div className="text-gray-400">No liked songs found.</div>
            ) : (
              <ul className="space-y-2">
                {likes.map((s, i) => (
                  <li key={i} className="bg-gray-800 p-3 rounded-md flex justify-between">
                    <span>{s.song_name || s.title || 'Unknown Song'}</span>
                    <span className="text-gray-400">{s.artist || ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl mb-4">
        <input
          className="w-full p-2 rounded-md text-white bg-gray-800"
          placeholder="Search playlists by name..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className="w-full max-w-3xl space-y-3">
        {filteredPlaylists.length === 0 ? (
          <div className="text-gray-400">You have no playlists.</div>
        ) : (
          filteredPlaylists.map(pl => (
            <div key={pl.playlist_id} className="bg-gray-800 rounded-md">
              <button
                onClick={() => toggleExpand(pl.playlist_id)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700 rounded-t-md"
              >
                <div>
                  <div className="font-semibold">{pl.playlist_name}</div>
                  <div className="text-sm text-gray-400">Playlist ID: {pl.playlist_id}</div>
                </div>
                <div className="text-gray-400">{expanded[pl.playlist_id] ? '▴' : '▾'}</div>
              </button>

              {expanded[pl.playlist_id] && (
                <div className="p-3 bg-gray-900 rounded-b-md">
                  {(!playlistSongs[pl.playlist_id] || playlistSongs[pl.playlist_id].length === 0) ? (
                    <div className="text-gray-400">No songs in this playlist.</div>
                  ) : (
                    <ul className="space-y-2">
                      {playlistSongs[pl.playlist_id].map((s, i) => (
                        <li key={i} className="bg-gray-800 p-3 rounded-md flex justify-between">
                          <span>{s.song_name}</span>
                          {/* <span className="text-gray-400">Track {s.track_number || ''}</span> */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;
