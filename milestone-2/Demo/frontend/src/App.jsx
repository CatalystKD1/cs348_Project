import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider";
import { useUserContext } from "./lib/AuthProvider";
import ProtectedRoute from "./lib/ProtectedRoute";
import PublicRoute from "./lib/PublicRoute";
import SignIn from "./pages/SignIn";
import F1UserPlaylists from "./pages/F1UserPlaylists";
import F2ArtistAlbums from "./pages/F2ArtistAlbums";
import F3SongsByGenre from "./pages/F3SongsByAlbumGenre";
import F4ArtistGuess from "./pages/F4ArtistGuess";
import Profile from "./pages/Profile";
import F5PopularSongs from "./pages/F5PopularSongs";
import SignUp from "./pages/SignUp";
import AF5SongSimilarity from "./pages/AF5SongSimilarity";
import GenerateRecommended from "./pages/GenerateRecommended";

function AppContent() {
  const { logout, isAuthenticated, user } = useUserContext();


  return (
    <div className="flex w-full min-h-screen bg-[#1b1b1b] text-white">
      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="fixed left-0 top-0 h-screen w-60 bg-black p-6 flex flex-col gap-6">
          {/* Logo */}
          <img src="/DatafyLogo.png" className="mb-6" />

          {/* User Info */}
          <Link to="/profile" className="flex items-center gap-3">
            <div
              style={{ backgroundColor: user.avatar.bgColour, width: 48, height: 48 }}
              className="rounded-full flex items-center justify-center text-white font-bold text-xl select-none"
            >
              {user.avatar.initial}
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-semibold">@{user.username}</p>
              <span className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
                View profile
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 mt-4">
            {[
              { path: "/f1", label: "User Playlists" },
              { path: "/f2", label: "Artist Albums" },
              { path: "/f3", label: "Songs By Genre" },
              { path: "/f4", label: "Higher or Lower Artist Followers" },
              { path: "/f5", label: "Most Popular User Songs" },
              { path: "/af5", label: "Song Similarity" },
              { path: "/recommend", label: "Generate Recommended" },
            ].map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md transition-colors ${isActive
                    ? "bg-rose-500 text-white font-semibold"
                    : "text-gray-400 hover:bg-gray-800 hover:text-rose-400"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-auto text-sm text-gray-400 hover:text-rose-500 hover:cursor-pointer transition-colors"
          >
            Logout
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 ml-60 overflow-y-auto">
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

          <Route
            path="/af5"
            element={
              <ProtectedRoute>
                <AF5SongSimilarity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recommend"
            element={
              <ProtectedRoute>
                <GenerateRecommended />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
