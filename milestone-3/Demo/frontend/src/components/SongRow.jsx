import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserContext } from '../lib/AuthProvider';

function SongRow({ title, subtitle, right, onClick, songId, className = '' }) {
  const { user, isAuthenticated } = useUserContext();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    async function load() {
      if (!user || !user.username) return;
      try {
        const res = await axios.get(
          `http://localhost:3000/user/${encodeURIComponent(
            user.username
          )}/playlists`
        );
        setPlaylists(res.data || []);
      } catch (err) {
        console.error('Failed to load playlists', err);
      }
    }
    load();
  }, [open, user]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2000);
  };

  // UPDATED: use POST /likes with JSON body (logs liked_at correctly)
  async function addToLikes() {
    if (!user || !songId) return;
    try {
      await axios.post('http://localhost:3000/likes', {
        user_id: user.user_id,
        song_id: songId,
      });
      showMessage('Added to Likes');
      setOpen(false);
    } catch (err) {
      console.error('Add to likes failed', err);
      showMessage('Failed to add to Likes');
    }
  }

  // UPDATED: use POST /playlist/add so PlaylistActions gets logged
  async function addToPlaylist(playlist_id, playlist_name) {
    if (!user || !songId || !playlist_id) return;
    try {
      await axios.post('http://localhost:3000/playlist/add', {
        user_id: user.user_id,
        playlist_id,
        song_id: songId,
      });
      showMessage(`Added to ${playlist_name}`);
      setOpen(false);
    } catch (err) {
      console.error('Add to playlist failed', err);
      showMessage('Failed to add to playlist');
    }
  }

  return (
    <li
      className={`bg-gray-900 p-3 rounded-md grid items-center relative ${className}`}
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <button onClick={onClick} className="text-left truncate" title={title}>
        <span className="truncate">{title}</span>
        {subtitle ? (
          <div className="text-xs text-gray-500">{subtitle}</div>
        ) : null}
      </button>

      <div className="flex items-center justify-end space-x-2">
        <div className="text-gray-400 text-right truncate mr-2">
          {right ?? ''}
        </div>

        {isAuthenticated && songId && (
          <div className="relative">
            <button
              aria-haspopup="true"
              aria-expanded={open}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((s) => !s);
              }}
              className="px-2 py-1 rounded hover:bg-gray-800"
            >
              {open ? '^' : '⋯'}
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-md z-50"
                onClick={() => setOpen(false)}
              >
                <ul className="p-2">
                  <li>
                    <button
                      onClick={addToLikes}
                      className="w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
                    >
                      Add to Likes
                    </button>
                  </li>

                  <li className="mt-2 border-t border-gray-700 pt-2 text-sm text-gray-300">
                    Add to playlist
                  </li>

                  {playlists.length > 0 ? (
                    playlists.map((p) => (
                      <li key={p.playlist_id}>
                        <button
                          onClick={() =>
                            addToPlaylist(p.playlist_id, p.playlist_name)
                          }
                          className="w-full text-left px-2 py-1 hover:bg-gray-700 rounded"
                        >
                          {p.playlist_name}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-1 text-gray-500">No playlists</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {message ? (
          <div className="text-xs text-green-400">{message}</div>
        ) : null}
      </div>
    </li>
  );
}

export default SongRow;
