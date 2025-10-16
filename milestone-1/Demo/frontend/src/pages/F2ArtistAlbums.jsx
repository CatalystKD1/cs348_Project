import React, { useState } from 'react';
import axios from 'axios';

function F2ArtistAlbums() {
  const [query, setQuery] = useState('');
  const [artistResults, setArtistResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);

  const searchArtists = async (q) => {
    if (!q) return setArtistResults([]);
    try {
      const res = await axios.get(`http://localhost:3000/artists/search?q=${q}`);
      setArtistResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlbums = async (artistName) => {
    setSelectedArtist(artistName);
    setSongs([]);
    try {
      const res = await axios.get(`http://localhost:3000/artist/${artistName}/albums`);
      setAlbums(res.data);
      setArtistResults([]);
      setQuery(artistName);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSongs = async (alID) => {
    try {
      const res = await axios.get(`http://localhost:3000/album/${alID}/songs`);
      setSongs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full bg-black text-white flex flex-col items-center p-8 rounded-2xl">
      <h2 className="text-3xl font-bold mb-6">Artist Albums & Songs</h2>

      {/* Search */}
      <div className="relative w-72 mb-6">
        <input
          className="w-full p-2 rounded-md text-white"
          placeholder="Search artist..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            searchArtists(e.target.value);
          }}
        />

        {artistResults.length > 0 && (
          <ul className="absolute w-full bg-gray-800 mt-1 rounded-md shadow-lg z-10">
            {artistResults.map(a => (
              <li
                key={a.artist_id}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => fetchAlbums(a.name)}
              >
                {a.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Albums */}
      {albums.length > 0 && (
        <div className="mt-6 w-full max-w-3xl">
          <h3 className="text-2xl mb-4">Albums by {selectedArtist}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {albums.map(al => (
              <div
                key={al.album_id}
                onClick={() => fetchSongs(al.album_id)}
                className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition"
              >
                <h4 className="font-semibold">{al.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Songs */}
      {songs.length > 0 && (
        <div className="mt-10 w-full max-w-2xl">
          <h3 className="text-2xl mb-4">Songs</h3>
          <ul className="space-y-2">
            {songs.map((s, i) => (
              <li key={i} className="bg-gray-900 p-3 rounded-md flex justify-between">
                <span>{s.name}</span>
                <span className="text-gray-400">Track {s.track_number}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default F2ArtistAlbums;
