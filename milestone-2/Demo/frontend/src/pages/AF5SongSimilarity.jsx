import React, { useState } from "react";
import axios from "axios";
import MainCard from "../components/MainCard";
import SongsList from "../components/SongsList";
import SongRow from "../components/SongRow";

export default function AF5SongSimilarity() {
  const [songQuery, setSongQuery] = useState("");
  const [threshold, setThreshold] = useState(1.0);
  const [limit, setLimit] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSimilarity = async () => {
    if (!songQuery.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await axios.get("http://localhost:3000/similarity", {
        params: {
          song: songQuery,
          threshold: threshold.toFixed(3),
          limit
        }
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Could not fetch similar songs.");
    }

    setLoading(false);
  };

  return (
    <MainCard title="AF5 — Song Similarity Engine">
      
      {/* Search Bar */}
      <div className="w-full max-w-lg mb-6">
        <input
          type="text"
          placeholder="Search for a song..."
          value={songQuery}
          onChange={(e) => setSongQuery(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-800 text-white placeholder-gray-400 outline-none"
        />
      </div>

      {/* Threshold Slider + Limit Input */}
      <div className="w-full max-w-lg mb-6 bg-gray-900 p-4 rounded-md">

        {/* Threshold */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm">Similarity Threshold</label>

          <div className="flex items-center gap-4 mt-2">
            <input
              type="range"
              min="0.600"
              max="1.000"
              step="0.001"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-gray-200 w-14 text-right font-semibold">
              {threshold.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Limit */}
        <div>
          <label className="text-gray-300 text-sm">Max Results (1–200)</label>
          <input
            type="number"
            min="1"
            max="200"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full p-2 mt-1 rounded-md bg-gray-800 text-white outline-none"
          />
        </div>

      </div>

      {/* Submit Button */}
      <button
        onClick={fetchSimilarity}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md text-white mb-4"
      >
        Find Similar Songs
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-700 text-white rounded-md max-w-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div className="mt-4 text-gray-300">Searching...</div>}

      {/* Input Song */}
      {result?.input_song && (
        <div className="mt-8 max-w-lg p-4 bg-gray-800 rounded-md text-gray-200">
          <h3 className="text-xl font-semibold mb-2">Input Song</h3>
          <p>
            <strong>{result.input_song.song_name}</strong><br />
            Duration: {result.input_song.duration_formatted}<br />
            Explicit: {result.input_song.explicit}<br />
            Album Popularity: {result.input_song.album_pop}
          </p>
        </div>
      )}

      {/* Recommended Songs */}
      {result?.recommendations && result.recommendations.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h3 className="text-xl font-semibold text-gray-200 mb-3">Recommended Songs</h3>

          <SongsList>
            {result.recommendations.map((song, i) => (
              <SongRow
                key={song.song_id}
                title={`${i + 1}. ${song.song_name}`}
                subtitle={song.artist_name}
                right={`Sim: ${song.similarity.toFixed(3)}`}
                songId={song.song_id}
              />
            ))}
          </SongsList>
        </div>
      )}

      {/* No results */}
      {result?.recommendations?.length === 0 && (
        <div className="mt-6 text-gray-400 max-w-lg">
          No songs matched the threshold.
        </div>
      )}

    </MainCard>
  );
}
