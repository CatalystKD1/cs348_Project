import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../lib/AuthProvider';
import MainCard from '../components/MainCard';

import CreatePlaylistModal from '../components/profile/CreatePlaylistModal';
import PlaylistSideBar from '../components/profile/PlaylistSideBar';
import LikedSongsPanel from '../components/profile/LikedSongsPanel';
import PlaylistEditor from '../components/profile/PlaylistEditor';
import SongSearchPanel from '../components/profile/SongSearchPanel';

function Profile() {
  const { user, isAuthenticated } = useUserContext();

  const [playlists, setPlaylists] = useState([]);
  const [playlistDiversity, setPlaylistDiversity] = useState({});
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState('');
  

  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);

  const [playlistSearch, setPlaylistSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [songResults, setSongResults] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [errorCreate, setErrorCreate] = useState('');
  const [menuOpen, setMenuOpen] = useState({});

  const [lastAction, setLastAction] = useState(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoError, setUndoError] = useState('');

  const primaryBgClass = 'bg-[oklch(70.4%_0.191_22.216)]';
  const primaryBgHoverClass = 'hover:bg-[oklch(70.4%_0.191_22.216)]';

  useEffect(() => {
    if (!isAuthenticated || !user || !user.username) return;
    loadPlaylists().then(loadPlaylistDiversity);;
    loadLikes();
  }, [isAuthenticated, user?.username]);

  useEffect(() => {
    if (!playlistSearch) {
      setFilteredPlaylists(playlists);
      return;
    }
    const lower = playlistSearch.trim().toLowerCase();
    setFilteredPlaylists(
      playlists.filter(
        (p) => (p.playlist_name || '').toLowerCase().includes(lower)
      )
    );
  }, [playlistSearch, playlists]);

  const loadPlaylistDiversity = async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `http://localhost:3000/user/${user.username}/playlists/diversity`
      );

      const diversityMap = {};
      for (const pl of res.data) {
        diversityMap[pl.playlist_id] = pl;
      }

      setPlaylistDiversity(diversityMap);
    } catch (err) {
      console.error("Failed to load playlist diversity:", err);
      setPlaylistDiversity({});
    }
  };

  const loadPlaylists = async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `http://localhost:3000/user/${user.username}/playlists`
      );
      const list = res.data || [];
      setPlaylists(list);
      setFilteredPlaylists(list);

      if (
        selectedPlaylistId &&
        !list.some((p) => p.playlist_id === selectedPlaylistId)
      ) {
        setSelectedPlaylistId(null);
        setSelectedPlaylistName('');
        setLastAction(null);
      }
    } catch (err) {
      console.error('Failed to load playlists', err);
      setPlaylists([]);
      setFilteredPlaylists([]);
      setSelectedPlaylistId(null);
      setSelectedPlaylistName('');
      setLastAction(null);
    }
  };

  const loadLikes = async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `http://localhost:3000/user/${user.username}/likes`
      );
      if (Array.isArray(res.data)) setLikes(res.data);
      else setLikes([]);
    } catch (err) {
      console.error('Failed to load likes', err);
      setLikes([]);
    }
  };

  const fetchPlaylistSongs = async (playlistId) => {
    if (!playlistId) return;
    try {
      const res = await axios.get(
        `http://localhost:3000/playlist/${playlistId}/songs`
      );
      setPlaylistSongs((prev) => ({
        ...prev,
        [playlistId]: res.data || [],
      }));
    } catch (err) {
      console.error('Failed to load playlist songs', err);
      setPlaylistSongs((prev) => ({ ...prev, [playlistId]: [] }));
    }
  };

  const loadLastAction = async (userId, playlistId) => {
    if (!userId || !playlistId) {
      setLastAction(null);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:3000/playlists/${playlistId}/actions/latest`,
        {
          params: { user_id: userId },
        }
      );
      setLastAction(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setLastAction(null);
      } else {
        console.error('Failed to load last action:', err);
      }
    }
  };

  // called from sidebar; if openModalFlag is true, we open the create modal
  const handleSelectPlaylist = (playlistId, playlistName, openModalFlag) => {
    if (openModalFlag) {
      setErrorCreate('');
      setShowCreate(true);
      return;
    }

    setSelectedPlaylistId(playlistId);
    setSelectedPlaylistName(playlistName);

    if (playlistId && !playlistSongs[playlistId]) {
      fetchPlaylistSongs(playlistId);
    }
    if (playlistId) {
      loadLastAction(user.user_id, playlistId);
    }

    if (playlistId) {
      setMenuOpen((prev) => ({ ...prev, [playlistId]: false }));
    }
  };

  const toggleMenu = (playlistId) => {
    setMenuOpen((prev) => ({
      ...prev,
      [playlistId]: !prev[playlistId],
    }));
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await axios.post('http://localhost:3000/playlists/delete', {
        user_id: user.user_id,
        playlist_id: playlistId,
      });

      setMenuOpen((prev) => ({ ...prev, [playlistId]: false }));

      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
        setSelectedPlaylistName('');
        setLastAction(null);
      }

      loadPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      alert('Failed to delete playlist. Check console for details.');
    }
  };

  const handleCreatePlaylist = async () => {
    setErrorCreate('');
    if (!newPlaylistName.trim()) {
      setErrorCreate('Playlist name cannot be empty.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/playlists/create', {
        user_id: user.user_id,
        playlist_name: newPlaylistName.trim(),
      });

      if (res.data && res.data.success) {
        const createdId = res.data.playlist_id;
        const createdName = res.data.playlist_name;

        setShowCreate(false);
        setNewPlaylistName('');

        await loadPlaylists();

        setSelectedPlaylistId(createdId);
        setSelectedPlaylistName(createdName);
        fetchPlaylistSongs(createdId);
        loadLastAction(user.user_id, createdId);
      } else {
        setErrorCreate('Failed to create playlist.');
      }
    } catch (err) {
      console.error('Create playlist failed:', err);
      setErrorCreate('Failed to create playlist.');
    }
  };

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
      const rows = res.data || [];

      // Deduplicate by song_id so the same track with multiple artists
      // doesn’t appear multiple times.
      const uniqueMap = new Map();
      for (const row of rows) {
        if (!uniqueMap.has(row.song_id)) {
          uniqueMap.set(row.song_id, row);
        }
      }

      setSongResults(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Song search failed:', err);
      setSongResults([]);
    }
  };

  // like / unlike
  const handleAddLike = async (song_id) => {
    try {
      await axios.post('http://localhost:3000/likes', {
        user_id: user.user_id,
        song_id,
      });
      loadLikes(); // refresh liked songs
    } catch (err) {
      console.error('Failed to add like:', err);
    }
  };

  const handleRemoveLike = async (song_id) => {
    try {
      await axios.post('http://localhost:3000/likes/remove', {
        user_id: user.user_id,
        song_id,
      });
      loadLikes(); // refresh liked songs
    } catch (err) {
      console.error('Failed to remove like:', err);
    }
  };

  // add / remove from SELECTED playlist
  const handleAddToSelectedPlaylist = async (playlist_id, song_id) => {
    try {
      await axios.post('http://localhost:3000/playlist/add', {
        user_id: user.user_id,
        playlist_id,
        song_id,
      });
      if (selectedPlaylistId === playlist_id) {
        fetchPlaylistSongs(playlist_id);
        loadLastAction(user.user_id, playlist_id);
      }
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  const handleRemoveFromSelectedPlaylist = async (playlist_id, song_id) => {
    try {
      await axios.post('http://localhost:3000/playlist/remove', {
        user_id: user.user_id,
        playlist_id,
        song_id,
      });
      if (selectedPlaylistId === playlist_id) {
        fetchPlaylistSongs(playlist_id);
        loadLastAction(user.user_id, playlist_id);
      }
    } catch (err) {
      console.error('Failed to remove from playlist:', err);
    }
  };


  const handleUndoLastAction = async () => {
    if (!selectedPlaylistId) {
      alert('Please select a playlist first.');
      return;
    }

    setUndoError('');
    setUndoLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/playlists/undo', {
        user_id: user.user_id,
        playlist_id: selectedPlaylistId,
      });

      const undone = res.data.undone;

      // Refresh playlists first
      await loadPlaylists();

      if (!undone) {
        setUndoError('Nothing to undo.');
        setLastAction(null);
        setUndoLoading(false);
        return;
      }

      if (undone.action_type === 'CREATE_PLAYLIST') {
        setSelectedPlaylistId(null);
        setSelectedPlaylistName('');
        setLastAction(null);
      } else {
        await fetchPlaylistSongs(selectedPlaylistId);
        await loadLastAction(user.user_id, selectedPlaylistId);
      }
    } catch (err) {
      console.error('Undo failed:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setUndoError(err.response.data.error);
      } else {
        setUndoError('Failed to undo last change.');
      }
    } finally {
      setUndoLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-6">Profile</h2>
        <div className="text-gray-400">
          You must be signed in to view your profile.
        </div>
      </div>
    );
  }

  const currentSongs =
    (selectedPlaylistId && playlistSongs[selectedPlaylistId]) || [];

  return (
    <MainCard
      title={`${user.username}'s Profile`}
      headerRight={
        <div className="text-sm text-gray-200">
          Manage your playlists &amp; likes
        </div>
      }
      className="bg-neutral-950"
    >
      <CreatePlaylistModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        newPlaylistName={newPlaylistName}
        setNewPlaylistName={setNewPlaylistName}
        errorCreate={errorCreate}
        onCreate={handleCreatePlaylist}
        primaryBgClass={primaryBgClass}
        primaryBgHoverClass={primaryBgHoverClass}
      />

      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* LEFT COLUMN */}
        <div className="w-full md:w-1/3 space-y-6">
          <PlaylistSideBar
            playlists={playlists}
            filteredPlaylists={filteredPlaylists}
            playlistDiversity={playlistDiversity}
            playlistSearch={playlistSearch}
            setPlaylistSearch={setPlaylistSearch}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={handleSelectPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            menuOpen={menuOpen}
            toggleMenu={toggleMenu}
            primaryBgClass={primaryBgClass}
            primaryBgHoverClass={primaryBgHoverClass}
          />

          <LikedSongsPanel
            likes={likes}
            showLikes={showLikes}
            setShowLikes={setShowLikes}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-2/3 space-y-6">
          <PlaylistEditor
            selectedPlaylistId={selectedPlaylistId}
            selectedPlaylistName={selectedPlaylistName}
            songs={currentSongs}
            lastAction={lastAction}
            undoError={undoError}
            undoLoading={undoLoading}
            onUndo={handleUndoLastAction}
            // ✅ use the defined function
            onRemoveSong={handleRemoveFromSelectedPlaylist}
            primaryBgClass={primaryBgClass}
            primaryBgHoverClass={primaryBgHoverClass}
            diversity={playlistDiversity[selectedPlaylistId] || null}
          />

          <SongSearchPanel
            songSearch={songSearch}
            songResults={songResults}
            onSearchChange={searchSongs}
            likes={likes}
            currentPlaylistSongs={currentSongs}
            selectedPlaylistId={selectedPlaylistId}
            selectedPlaylistName={selectedPlaylistName}
            onLike={handleAddLike}
            onUnlike={handleRemoveLike}
            onAddToPlaylist={handleAddToSelectedPlaylist}
            onRemoveFromPlaylist={handleRemoveFromSelectedPlaylist}
          />
        </div>
      </div>
    </MainCard>
  );
}

export default Profile;
