import React, { useState } from "react";
import axios from "axios";
import MainCard from "../components/MainCard";
import SongsList from "../components/SongsList";
import SongRow from "../components/SongRow";

export default function AF5SongSimilarity() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Search songs by partial name (autocomplete)
  const searchSongs = async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get("http://localhost:3000/songs/search", {
        params: { q }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSimilarity = async (songName) => {
    if (!songName.trim()) return;

    setQuery(songName);
    setSearchResults([]);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await axios.get("http://localhost:3000/similarity", {
        params: { song: songName }
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Could not fetch song similarity results.");
    }

    setLoading(false);
  };

  return (
    <MainCard title="AF5 — Song Similarity Engine">
      
      {/* Error message */}
      {error && (
        <div className="mb-4 w-full bg-red-600 text-white px-4 py-2 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-80 mb-6">
        <input
          className="w-full p-2 rounded-md text-white bg-gray-800"
          placeholder="Search for a song..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchSongs(e.target.value);
          }}
        />

        {/* Autocomplete dropdown */}
        {searchResults.length > 0 && (
          <ul className="absolute w-full bg-gray-800 mt-1 rounded-md shadow-lg z-10">
            {searchResults.map((song) => (
              <li
                key={song.song_id}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => fetchSimilarity(song.song_name)}
              >
                {song.song_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Show loading */}
      {loading && <div className="text-gray-300 mb-4">Loading...</div>}

      {/* Input Song Info */}
      {result?.input_song && (
        <div className="mb-8 bg-gray-800 p-4 rounded-md">
          <h3 className="font-bold text-xl mb-2">Input Song</h3>
          <p>
            <strong>{result.input_song.song_name}</strong>
            <br />
            Duration: {result.input_song.duration_formatted}
            <br />
            Explicit: {result.input_song.explicit}
            <br />
            Album Popularity: {result.input_song.album_pop}
          </p>

        </div>
      )}

      {/* Similar Songs List */}
      {result?.recommendations?.length > 0 && (
        <SongsList title="Top 10 Similar Songs">
          {result.recommendations.map((rec, i) => (
            <SongRow
              key={rec.song_id}
              title={rec.song_name}
              subtitle={rec.artist_name}
              extra={`Similarity: ${rec.similarity.toFixed(3)}`}
              songId={rec.song_id}
            />
          ))}
        </SongsList>
      )}
    </MainCard>
  );
}
