import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider";
import { useUserContext } from "./lib/AuthProvider";
import ProtectedRoute from "./lib/ProtectedRoute";
import PublicRoute from "./lib/PublicRoute";
import SignIn from "./pages/SignIn";
import F1UserPlaylists from "./pages/F1UserPlaylists";
import F2ArtistAlbums from "./pages/F2ArtistAlbums";
import F3SongsByGenre from "./pages/F3SongsByAlbumGenre";
import F4ArtistGuess from "./pages/F4ArtistGuess";
import F5PopularSongs from "./pages/F5PopularSongs";
import SignUp from "./pages/SignUp";

function AppContent() {
  const { logout, isAuthenticated } = useUserContext();

  return (
    <div className="flex w-full min-h-screen bg-[#1b1b1b] text-white">
      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="w-60 bg-black p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-rose-400 mb-6">Demo</h1>
          <nav className="flex flex-col gap-3">
            <Link to="/f1" className="hover:text-rose-400 transition-colors">
              F1: User Playlists
            </Link>
            <Link to="/f2" className="hover:text-rose-400 transition-colors">
              F2: Artist Albums
            </Link>
            <Link to="/f3" className="hover:text-rose-400 transition-colors">
              F3: Songs By Genre
            </Link>
            <Link to="/f4" className="hover:text-rose-400 transition-colors">
              F4: Higher or Lower Artist Followers
            </Link>
            <Link to="/f5" className="hover:text-rose-400 transition-colors">
              F5: Most Popular User Songs
            </Link>
          </nav>
          <button
            onClick={logout}
            className="mt-auto text-sm text-gray-400 hover:text-rose-500 hover:cursor-pointer"
          >
            Logout
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/sign-in"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />

          <Route
            path="/sign-up"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />

          <Route path="/" element={<Navigate to="/f1" replace />} />

          <Route
            path="/f1"
            element={
              <ProtectedRoute>
                <F1UserPlaylists />
              </ProtectedRoute>
            }
          />

          <Route
            path="/f2"
            element={
              <ProtectedRoute>
                <F2ArtistAlbums />
              </ProtectedRoute>
            }
          />

          <Route
            path="/f3"
            element={
              <ProtectedRoute>
                <F3SongsByGenre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/f4"
            element={
              <ProtectedRoute>
                <F4ArtistGuess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/f5"
            element={
              <ProtectedRoute>
                <F5PopularSongs />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
