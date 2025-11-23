// components/profile/PlaylistSidebar.jsx
import React from 'react';

const PlaylistSidebar = ({
  playlists,
  filteredPlaylists,
  playlistSearch,
  setPlaylistSearch,
  selectedPlaylistId,
  onSelectPlaylist,
  onDeletePlaylist,
  menuOpen,
  toggleMenu,
  primaryBgClass,
  primaryBgHoverClass,
}) => {
  return (
    <div className="mt-3 bg-neutral-950 rounded-md p-2 max-h-72 border border-neutral-800 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">Your Playlists</h3>
        <button
          onClick={onSelectPlaylist.bind(null, null, null, true)} // special flag to open modal
          className={`text-xs ${primaryBgClass} ${primaryBgHoverClass} text-black px-3 py-1 rounded-md`}
        >
          + New
        </button>
      </div>

      <input
        className="w-full mb-3 p-2 rounded-md text-sm text-white bg-neutral-800"
        placeholder="Search playlists by name..."
        value={playlistSearch}
        onChange={(e) => setPlaylistSearch(e.target.value)}
      />

      {filteredPlaylists.length === 0 ? (
        <div className="text-gray-400 text-sm">
          You have no playlists. Create one to get started.
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-1 flex-1">
          {filteredPlaylists.map((pl) => {
            const isSelected = selectedPlaylistId === pl.playlist_id;
            return (
              <li
                key={pl.playlist_id}
                className={`flex items-center justify-between rounded-md cursor-pointer ${
                  isSelected
                    ? `${primaryBgClass} text-black`
                    : 'bg-neutral-800 hover:bg-neutral-700'
                }`}
              >
                <button
                  className="flex-1 text-left px-3 py-2"
                  type="button"
                  onClick={() =>
                    onSelectPlaylist(pl.playlist_id, pl.playlist_name)
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {pl.playlist_name}
                    </span>
                  </div>
                </button>

                <div className="relative pr-2">
                  <button
                    type="button"
                    onClick={() => toggleMenu(pl.playlist_id)}
                    className={`p-1 text-xs rounded-md ${
                      isSelected
                        ? 'text-black/80 hover:bg-black/10'
                        : 'text-gray-400 hover:text-white hover:bg-neutral-700'
                    }`}
                    aria-expanded={!!menuOpen[pl.playlist_id]}
                  >
                    ⋯
                  </button>

                  {menuOpen[pl.playlist_id] && (
                    <div className="absolute right-0 mt-1 w-40 bg-neutral-950 border border-neutral-700 rounded-md shadow-lg z-10">
                      <button
                        type="button"
                        onClick={() => onDeletePlaylist(pl.playlist_id)}
                        className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white text-xs text-red-400"
                      >
                        Delete playlist
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PlaylistSidebar;
