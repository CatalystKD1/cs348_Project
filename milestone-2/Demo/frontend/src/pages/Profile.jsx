import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../lib/AuthProvider';
import SongRow from '../components/SongRow';
import MainCard from '../components/MainCard';

function Profile() {
  const { user, isAuthenticated } = useUserContext();

  const [playlists, setPlaylists] = useState([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);

  // Search states
  const [search, setSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [songResults, setSongResults] = useState([]);

  // NEW — Create playlist modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [errorCreate, setErrorCreate] = useState('');
  const [menuOpen, setMenuOpen] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !user || !user.username) return;
    loadPlaylists();
    loadLikes();
  }, [isAuthenticated, user.username]);

  const loadPlaylists = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.username}/playlists`);
      setPlaylists(res.data || []);
      setFilteredPlaylists(res.data || []);
    } catch (err) {
      console.log('Failed to load playlists', err);
      setPlaylists([]);
      setFilteredPlaylists([]);
    }
  };

  const loadLikes = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/user/${user.username}/likes`);
      if (Array.isArray(res.data)) setLikes(res.data);
      else setLikes([]);
    } catch (err) {
      console.error('Failed to load likes', err);
      setLikes([]);
    }
  };

  const fetchPlaylistSongs = async (playlistId) => {
    try {
      const res = await axios.get(`http://localhost:3000/playlist/${playlistId}/songs`);
      setPlaylistSongs(prev => ({ ...prev, [playlistId]: res.data || [] }));
    } catch (err) {
      console.error('Failed to load playlist songs', err);
      setPlaylistSongs(prev => ({ ...prev, [playlistId]: [] }));
    }
  };

  const toggleExpand = async (playlistId) => {
    setExpanded(prev => {
      const next = !prev[playlistId];
      if (next && !playlistSongs[playlistId]) {
        fetchPlaylistSongs(playlistId);
      }
      return { ...prev, [playlistId]: next };
    });
  };

  const toggleMenu = (playlistId) => {
    setMenuOpen(prev => ({ ...prev, [playlistId]: !prev[playlistId] }));
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await axios.post('http://localhost:3000/playlists/delete', {
        user_id: user.user_id,
        playlist_id: playlistId,
      });

      setMenuOpen(prev => ({ ...prev, [playlistId]: false }));
      loadPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (!q) return setFilteredPlaylists(playlists);

    const lower = q.trim().toLowerCase();
    setFilteredPlaylists(
      playlists.filter(p => (p.playlist_name || '').toLowerCase().includes(lower))
    );
  };

  // SONG SEARCH (GLOBAL)
  const searchSongs = async (q) => {
    setSongSearch(q);

    if (!q || q.trim().length < 2) {
      setSongResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:3000/songs/search?q=${encodeURIComponent(q)}`
      );
      setSongResults(res.data || []);
    } catch (err) {
      console.error('Song search failed:', err);
      setSongResults([]);
    }
  };

  // ADD TO LIKES
  const handleAddLike = async (song_id) => {
    try {
      await axios.post('http://localhost:3000/likes', {
        user_id: user.user_id,
        song_id
      });
      loadLikes();
    } catch (err) {
      console.error('Failed to add like:', err);
    }
  };

  // ADD TO PLAYLIST
  const handleAddToPlaylist = async (playlist_id, song_id) => {
    try {
      await axios.post('http://localhost:3000/playlist/add', {
        user_id: user.user_id,
        playlist_id,
        song_id
      });

      if (expanded[playlist_id]) {
        fetchPlaylistSongs(playlist_id);
      }
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  // CREATE PLAYLIST
  const handleCreatePlaylist = async () => {
    setErrorCreate('');

    if (!newPlaylistName.trim()) {
      setErrorCreate('Playlist name cannot be empty.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/playlists/create', {
        user_id: user.user_id,
        playlist_name: newPlaylistName.trim()
      });

      if (res.data.success) {
        setShowCreate(false);
        setNewPlaylistName('');
        loadPlaylists();
      }
    } catch (err) {
      console.error('Create playlist failed:', err);
      setErrorCreate('Failed to create playlist.');
    }
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
    <MainCard
      title={`${user.username}'s Profile`}
      headerRight={<div className="text-sm text-gray-400">Manage your playlists & likes</div>}
    >

      {/* CREATE PLAYLIST BUTTON */}
      <div className="w-full max-w-3xl mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white"
        >
          + Create Playlist
        </button>
      </div>

      {/* CREATE PLAYLIST POPUP */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Create Playlist</h2>

            <input
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="w-full mb-3 p-2 rounded-md bg-gray-800 text-white"
            />

            {errorCreate && (
              <div className="text-red-400 text-sm mb-3">{errorCreate}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SONG SEARCH */}
      <div className="w-full max-w-3xl mb-6">
        <input
          className="w-full p-2 rounded-md text-white bg-gray-800"
          placeholder="Search for songs to add..."
          value={songSearch}
          onChange={e => searchSongs(e.target.value)}
        />
        {songResults.length > 0 && (
          <div className="mt-3 bg-gray-900 rounded-md p-3 space-y-2">
            {songResults.map(song => (
              <div
                key={song.song_id}
                className="flex items-center justify-between gap-4 border-b border-gray-800 last:border-none pb-2"
              >
                <div>
                  <div className="font-semibold text-white">
                    {song.song_name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {song.artist_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddLike(song.song_id)}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm px-3 py-1 rounded-md"
                  >
                    + Like
                  </button>

                  <select
                    className="bg-gray-800 text-sm text-white px-2 py-1 rounded-md"
                    defaultValue=""
                    onChange={e => {
                      const playlistId = e.target.value;
                      if (!playlistId) return;
                      handleAddToPlaylist(playlistId, song.song_id);
                      e.target.value = '';
                    }}
                  >
                    <option value="">Add to playlist...</option>
                    {playlists.map(pl => (
                      <option key={pl.playlist_id} value={pl.playlist_id}>
                        {pl.playlist_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIKED SONGS */}
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
                  <SongRow
                    key={i}
                    title={s.song_name}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* PLAYLIST SEARCH */}
      <div className="w-full max-w-3xl mb-4">
        <input
          className="w-full p-2 rounded-md text-white bg-gray-800"
          placeholder="Search playlists by name..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* PLAYLIST LIST */}
      <div className="w-full max-w-3xl space-y-3">
        {filteredPlaylists.length === 0 ? (
          <div className="text-gray-400">You have no playlists.</div>
        ) : (
          filteredPlaylists.map((pl) => (
            <div key={pl.playlist_id} className="bg-gray-800 rounded-md">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(pl.playlist_id)}
                  className="flex-1 text-left p-4 hover:bg-gray-700 rounded-t-md"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{pl.playlist_name}</div>
                    </div>
                    <div className="text-gray-400">
                      {expanded[pl.playlist_id] ? '▴' : '▾'}
                    </div>
                  </div>
                </button>

                <div className="pr-3 relative">
                  <button
                    onClick={() => toggleMenu(pl.playlist_id)}
                    className="p-2 text-gray-400 hover:text-white rounded-md"
                    aria-expanded={!!menuOpen[pl.playlist_id]}
                  >
                    ⋯
                  </button>

                  {menuOpen[pl.playlist_id] && (
                    <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleDeletePlaylist(pl.playlist_id)}
                        className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white text-sm text-red-400"
                      >
                        Delete playlist
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {expanded[pl.playlist_id] && (
                <div className="p-3 bg-gray-900 rounded-b-md">
                  {!playlistSongs[pl.playlist_id] ||
                  playlistSongs[pl.playlist_id].length === 0 ? (
                    <div className="text-gray-400">No songs in this playlist.</div>
                  ) : (
                    <ul className="space-y-2">
                      {playlistSongs[pl.playlist_id].map((s, i) => (
                        <SongRow key={i} title={s.song_name} />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </MainCard>
  );
}

export default Profile;
