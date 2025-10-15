import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import F1UserPlaylists from './pages/F1UserPlaylists';
import F2ArtistAlbums from './pages/F2ArtistAlbums';
// import F3GenreSearch from './pages/F3GenreSearch';
// import F4ArtistFollowers from './pages/F4ArtistFollowers';

function App() {
  return (
    <Router>
      <div className="flex w-fi min-h-screen bg-[#1b1b1b] text-white">
        {/* Sidebar */}
        <aside className="w-60 bg-black p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-[#1db954] mb-6">Demo</h1>
          <nav className="flex flex-col gap-3">
            <Link
              to="/f1"
              className="hover:text-[#1db954] transition-colors"
            >
              F1: User Playlists
            </Link>
            <Link
              to="/f2"
              className="hover:text-[#1db954] transition-colors"
            >
              F2: Artist Albums
            </Link>
            {/* <Link to="/f3" className="hover:text-[#1db954] transition-colors">
              Genre Filter
            </Link>
            <Link to="/f4" className="hover:text-[#1db954] transition-colors">
              Artist Followers
            </Link> */}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/f1" element={<F1UserPlaylists />} />
            <Route path="/f2" element={<F2ArtistAlbums />} />
            {/* <Route path="/f3" element={<F3GenreSearch />} />
            <Route path="/f4" element={<F4ArtistFollowers />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;