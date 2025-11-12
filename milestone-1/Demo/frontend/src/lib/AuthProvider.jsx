import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Default user structure
export const INITIAL_USER = {
  user_id: "",
  username: "",
  email: "",
};

// Initial state for context
const INITIAL_STATE = {
  user: INITIAL_USER,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => { },
  setIsAuthenticated: () => { },
  checkAuthUser: async () => false,
  login: async () => false,
  logout: async () => { },
};

// Create Context
const AuthContext = createContext(INITIAL_STATE);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keys for localStorage
  const USERS_KEY = "demo_users";
  const SESSION_KEY = "demo_session";

  // Check if there's a saved session
  const checkAuthUser = async () => {
    setIsLoading(true);
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const savedUser = JSON.parse(session);
        setUser(savedUser);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(INITIAL_USER);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error("checkAuthUser error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        navigate("/");  // redirect to home
        return true;
      } else {
        alert(data.error || "Invalid credentials");
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Could not connect to server");
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  // Logout
  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(INITIAL_USER);
    setIsAuthenticated(false);
    navigate("/sign-in");
  };

  // Run on mount
  useEffect(() => {
    checkAuthUser();
  }, []);

  if (isLoading) {
    return <div className="flex-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
        isLoading,
        checkAuthUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

// Hook for easy access
export const useUserContext = () => useContext(AuthContext);
