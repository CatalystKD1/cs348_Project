import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SongRow from '../components/SongRow';
import MainCard from '../components/MainCard';
import SongsList from '../components/SongsList';

function F3SongsByGenre() {
  const demoText = "hip hop";

  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(demoText);

  const [songs, setSongs] = useState([]);
  const [genreSuggestions, setGenreSuggestions] = useState([]);

  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const [page, setPage] = useState(0);
  const limit = 10; // songs per page

  const suggestionsRef = useRef(null);

  //API helpers

  const loadSongs = async (genre, pageToLoad = 0) => {
    if (!genre) return;
    try {
      setLoadingSongs(true);
      setError("");
      const res = await axios.get("http://localhost:3000/songs/by-genre", {
        params: { genre, limit, page: pageToLoad },
      });

      // support { songs: [...] } or just [...] in case backend differs
      const data = res.data;
      const songsData = Array.isArray(data) ? data : data.songs || [];
      setSongs(songsData);
    } catch (err) {
      console.error("Failed to fetch songs by genre", err);
      setSongs([]);
      setError("Failed to load songs. Please try again.");
    } finally {
      setLoadingSongs(false);
    }
  };

  const loadGenreSuggestions = async (text) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setGenreSuggestions([]);
      return;
    }

    try {
      setLoadingGenres(true);
      const res = await axios.get("http://localhost:3000/genres/search", {
        params: { q: trimmed },
      });
      setGenreSuggestions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch genre suggestions", err);
      setGenreSuggestions([]);
    } finally {
      setLoadingGenres(false);
    }
  };

  // Initial load: default songs for demoText 

  useEffect(() => {
    loadSongs(demoText, 0);
  }, []);

  // Typewriter + delete animation for demoText in the search bar 

  useEffect(() => {
    if (!isAnimating) return;

    let i = 0;
    let deleting = false;

    const interval = setInterval(() => {
      if (!deleting) {
        // typing forward
        setQuery(demoText.slice(0, i + 1));
        i += 1;

        if (i === demoText.length) {
          // once fully typed, pause, then start deleting
          setTimeout(() => {
            deleting = true;
          }, 800);
        }
      } else {
        // deleting backwards
        i -= 1;
        setQuery(demoText.slice(0, i));

        if (i === 0) {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isAnimating, demoText]);

  // Handlers 

  const handleInputChange = (e) => {
    const value = e.target.value;
    setIsAnimating(false); // stop animation as soon as user types
    setQuery(value);
    setShowSuggestions(true);
    loadGenreSuggestions(value);
  };

  const handleSuggestionClick = (gname) => {
    setQuery(gname);
    setSelectedGenre(gname);
    setShowSuggestions(false);
    setPage(0);
    loadSongs(gname, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSelectedGenre(trimmed);
    setShowSuggestions(false);
    setPage(0);
    loadSongs(trimmed, 0);
  };

  // close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Pagination handlers ---

  const handlePrevPage = () => {
    if (page === 0) return;
    const newPage = page - 1;
    setPage(newPage);
    loadSongs(selectedGenre, newPage);
  };

  const handleNextPage = () => {
    // heuristic: if we got < limit results, no more pages
    if (songs.length < limit) return;
    const newPage = page + 1;
    setPage(newPage);
    loadSongs(selectedGenre, newPage);
  };

  // Rendering html

  return (
    <MainCard title="Songs By Album Genre">
      <form
        onSubmit={handleSubmit}
        className="relative w-64"
        ref={suggestionsRef}
      >
          <span className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
              />
            </svg>
          </span>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Type a genre (e.g. hip hop)"
            className="w-full bg-gray-800 text-white text-sm pl-9 pr-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {loadingGenres && (
            <span className="absolute right-3 top-2.5 text-xs text-gray-400">
              ...
            </span>
          )}

          {showSuggestions && genreSuggestions.length > 0 && (
            <ul className="absolute mt-1 w-full bg-gray-900 border border-gray-700 rounded-md max-h-48 overflow-y-auto z-10">
              {genreSuggestions.map((g, i) => (
                <li
                  key={`${g.gname}-${i}`}
                  className="px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSuggestionClick(g.gname)}
                >
                  <div className="flex justify-between">
                    <span>{g.gname}</span>
                    {g.song_count !== undefined && (
                      <span className="text-gray-400 text-xs">
                        {g.song_count}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </form>

      <div className="mt-2">
        {/* Header row */}
        <div className="bg-gray-800 p-3 rounded-md grid grid-cols-2 font-semibold text-gray-300 mb-2">
          <span>Song Title</span>
          <span className="text-right">Artist</span>
        </div>

        {loadingSongs && (
          <div className="text-gray-400 text-sm mt-2">
            Loading songs for "{selectedGenre}"...
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm mt-2">
            {error}
          </div>
        )}

        {!loadingSongs && !error && songs.length === 0 && (
          <div className="text-gray-400 text-sm mt-2">
            No songs found for "{selectedGenre}".
          </div>
        )}

        <SongsList>
          {songs.map((s, i) => (
            <SongRow
              key={`${s.song_title}-${s.artist}-${i}`}
              title={`${page * limit + i + 1}. ${s.song_title}`}
              subtitle={s.artist}
            />
          ))}
        </SongsList>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-300">
          <button
            onClick={handlePrevPage}
            disabled={page === 0}
            className={`px-3 py-1 rounded-md border border-gray-700 ${
              page === 0
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-800 cursor-pointer"
            }`}
          >
            Previous
          </button>

          <span>
            Page <span className="font-semibold">{page + 1}</span>
          </span>

          <button
            onClick={handleNextPage}
            disabled={songs.length < limit}
            className={`px-3 py-1 rounded-md border border-gray-700 ${
              songs.length < limit
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-800 cursor-pointer"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </MainCard>
  );
}

export default F3SongsByGenre;
