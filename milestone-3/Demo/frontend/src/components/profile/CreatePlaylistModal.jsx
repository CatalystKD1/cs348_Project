import React from 'react';

const CreatePlaylistModal = ({
  open,
  onClose,
  newPlaylistName,
  setNewPlaylistName,
  errorCreate,
  onCreate,
  primaryBgClass,
  primaryBgHoverClass,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-20">
      <div className="bg-neutral-950 p-6 rounded-lg w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Create Playlist</h2>

        <input
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="Playlist name..."
          className="w-full mb-3 p-2 rounded-md bg-neutral-800 text-white"
        />

        {errorCreate && (
          <div className="text-red-400 text-sm mb-3">{errorCreate}</div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className={`px-4 py-2 ${primaryBgClass} ${primaryBgHoverClass} text-black font-medium rounded-md`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
