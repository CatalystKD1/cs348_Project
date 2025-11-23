import React from 'react';

function SongSearchPanel({
  songSearch,
  songResults,
  onSearchChange,
  likes,
  currentPlaylistSongs,
  selectedPlaylistId,
  selectedPlaylistName,
  onLike,
  onUnlike,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}) {
  // Build quick-lookup sets based on *song_id*
  const likedSongIds = new Set(likes.map((s) => s.song_id));
  const playlistSongIds = new Set(
    (currentPlaylistSongs || []).map((s) => s.song_id)
  );

  return (
    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800">
      <h3 className="font-semibold text-white mb-2">Search songs to add</h3>

      <input
        className="w-full p-2 rounded-md text-sm text-white bg-neutral-900 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        placeholder="Search for songs..."
        value={songSearch}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {songResults.length > 0 && (
        <div className="mt-3 bg-neutral-950 rounded-md p-3 space-y-2 max-h-72 overflow-y-auto border border-neutral-800">
          {songResults.map((song) => {
            const isLiked = likedSongIds.has(song.song_id);
            const inCurrentPlaylist =
              !!selectedPlaylistId && playlistSongIds.has(song.song_id);

            return (
              <div
                key={song.song_id}
                className="flex items-center justify-between gap-4 border-b border-neutral-800 last:border-none pb-2"
              >
                <div>
                  <div className="font-semibold text-white text-sm">
                    {song.song_name}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {song.artist_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Like / Unlike button */}
                  <button
                    type="button"
                    onClick={() =>
                      isLiked
                        ? onUnlike(song.song_id)
                        : onLike(song.song_id)
                    }
                    className={`text-xs px-3 py-1 rounded-md ${
                      isLiked
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    {isLiked ? 'Unlike' : '+ Like'}
                  </button>

                  {/* Add / Remove from *selected* playlist */}
                  {selectedPlaylistId ? (
                    <button
                      type="button"
                      onClick={() =>
                        inCurrentPlaylist
                          ? onRemoveFromPlaylist(
                              selectedPlaylistId,
                              song.song_id
                            )
                          : onAddToPlaylist(selectedPlaylistId, song.song_id)
                      }
                      className={`text-xs px-3 py-1 rounded-md ${
                        inCurrentPlaylist
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {inCurrentPlaylist
                        ? 'Remove from playlist'
                        : `Add to "${selectedPlaylistName || 'playlist'}"`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    >
                      Select playlist first
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SongSearchPanel;
