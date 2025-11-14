import { Navigate } from "react-router-dom";
import { useUserContext } from "./AuthProvider";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserContext();

  if (isLoading) {
    return <div className="flex-center">Loading...</div>;
  }

  // If the user is already logged in, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;