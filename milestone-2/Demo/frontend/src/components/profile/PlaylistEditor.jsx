import React from 'react';

const PlaylistEditor = ({
  selectedPlaylistId,
  selectedPlaylistName,
  songs,
  lastAction,
  undoError,
  undoLoading,
  onUndo,
  onRemoveSong,
  primaryBgClass,
  primaryBgHoverClass,
}) => {
  return (
    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-xs text-gray-400 mb-1">Currently editing</div>
          <div className="text-lg font-semibold text-white">
            {selectedPlaylistId
              ? selectedPlaylistName
              : 'No playlist selected'}
          </div>
        </div>

        {selectedPlaylistId && (
          <button
            type="button"
            onClick={onUndo}
            disabled={undoLoading || !lastAction}
            className={`text-xs px-3 py-1 rounded-md ${
              undoLoading || !lastAction
                ? 'bg-neutral-700 text-gray-400 cursor-not-allowed'
                : `${primaryBgClass} ${primaryBgHoverClass} text-black font-medium`
            }`}
          >
            {undoLoading ? 'Undoing...' : 'Undo last change'}
          </button>
        )}
      </div>

      {selectedPlaylistId && (
        <>
          <div className="mb-2 text-xs text-gray-300">
            Last change:{' '}
            {lastAction ? (
              <span className="text-gray-100">
                {lastAction.action_type} at {lastAction.action_time}
              </span>
            ) : (
              <span className="text-gray-500">
                No recorded changes yet.
              </span>
            )}
          </div>

          {undoError && (
            <div className="text-red-400 text-xs mb-2">{undoError}</div>
          )}
        </>
      )}

      <div className="mt-3 bg-neutral-950 rounded-md p-3 max-h-72 overflow-y-auto border border-neutral-800">
        {!selectedPlaylistId ? (
          <div className="text-gray-400 text-sm">
            Select a playlist from the left to see its songs and edit it.
          </div>
        ) : !songs || songs.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No songs in this playlist yet. Use the search below to add songs.
          </div>
        ) : (
          <ul className="space-y-2">
            {songs.map((s) => (
              <li
                key={s.song_id}
                className="flex items-center justify-between bg-neutral-900 rounded-md px-3 py-2"
              >
                <span className="text-sm text-white truncate">
                  {s.song_name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSong(s.song_id)}
                  className="text-xs px-2 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistEditor;
