// frontend/src/components/profile/LikedSongsPanel.jsx
import React, { useState } from 'react';
import SongRow from '../SongRow';

const LIKES_PER_PAGE = 5;

const LikedSongsPanel = ({ likes, showLikes, setShowLikes }) => {
  const [likesPage, setLikesPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(likes.length / LIKES_PER_PAGE));
  const safePage = Math.min(Math.max(likesPage, 1), totalPages);

  const startIndex = (safePage - 1) * LIKES_PER_PAGE;
  const likesOnPage = likes.slice(startIndex, startIndex + LIKES_PER_PAGE);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setLikesPage(page);
  };

  return (
    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800 w-full">
      {/* Header */}
      <button
        type="button"
        onClick={() => setShowLikes((s) => !s)}
        className="w-full text-left flex justify-between items-center"
      >
        <div>
          <div className="font-semibold text-white">Liked Songs</div>
          <div className="text-xs text-gray-400">{likes.length} songs</div>
        </div>
        <div className="text-gray-400 text-lg">{showLikes ? '▴' : '▾'}</div>
      </button>

      {showLikes && (
        <div className="mt-3 rounded-md p-3 bg-neutral-950 border border-neutral-800">
          {likes.length === 0 ? (
            <div className="text-gray-400 text-sm">No liked songs found.</div>
          ) : (
            <>
              {/* Song List */}
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {likesOnPage.map((s, i) => (
                  <SongRow key={`${s.song_id || i}`} title={s.song_name} />
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs text-gray-300">
                  <button
                    type="button"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className={`px-2 py-1 rounded-md border ${
                      safePage <= 1
                        ? 'border-neutral-700 text-neutral-600 cursor-not-allowed'
                        : 'border-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    Prev
                  </button>

                  <span>
                    Page <span className="font-semibold">{safePage}</span> of{' '}
                    <span className="font-semibold">{totalPages}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className={`px-2 py-1 rounded-md border ${
                      safePage >= totalPages
                        ? 'border-neutral-700 text-neutral-600 cursor-not-allowed'
                        : 'border-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LikedSongsPanel;
