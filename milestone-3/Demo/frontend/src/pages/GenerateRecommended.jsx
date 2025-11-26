import React, { useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../lib/AuthProvider';
import MainCard from '../components/MainCard';
import SongRow from '../components/SongRow';


export default function GenerateRecommended() {
  const { user, isAuthenticated } = useUserContext();
  const [playlistName, setPlaylistName] = useState('Recommended For You');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!isAuthenticated || !user || !user.user_id) {
      setError('You must be signed in to generate a playlist');
      return;
    }

    setError('');
    setLoading(true);
    setPlaylist(null);

    try {
      const res = await axios.post(
        `http://localhost:3000/user/${user.user_id}/recommendations`,
        { playlistName }
      );

      setPlaylist(res.data || null);
    } catch (err) {
      console.error('Generate failed', err);
      setError(err?.response?.data?.error || 'Failed to generate playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-6">Recommendations</h2>
        <div className="text-gray-400">You must be signed in to generate a playlist.</div>
      </div>
    );
  }

  return (
    <MainCard
      title="Generate Recommended Playlist"
      headerRight={<div className="text-sm text-gray-400">Auto-generate a playlist based on your likes</div>}
    >
      <div className="w-full max-w-3xl mb-4">
        <label className="block text-sm text-gray-300 mb-2">Playlist name</label>
        <input
          className="w-full p-2 rounded-md text-white bg-gray-800"
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
        />
      </div>

      <div className="w-full max-w-3xl mb-6 flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white"
        >
          {loading ? 'Generating…' : 'Generate Playlist'}
        </button>
        <div className="text-sm text-gray-400 self-center">This will create a playlist in your account.</div>
      </div>

      {error && (
        <div className="w-full max-w-3xl mb-4 text-red-400">{error}</div>
      )}

      {playlist && (
        <div className="w-full max-w-3xl space-y-3">
          <div className="bg-gray-800 rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-semibold text-lg text-white">{playlist.playlistName}</div>
                <div className="text-sm text-gray-400">{playlist.totalSongs} songs</div>
              </div>
            </div>

            {playlist.songs && playlist.songs.length > 0 ? (
              <ul className="space-y-2">
                {playlist.songs.map((s, i) => (
                  <SongRow
                    key={s.song_id || i}
                    title={s.song_name}
                    right={s.artist_name || ''}
                    songId={s.song_id}
                  />
                ))}
              </ul>
            ) : (
              <div className="text-gray-400">No songs were generated.</div>
            )}
          </div>
        </div>
      )}
    </MainCard>
  );
}
