import { Navigate } from "react-router-dom";
import { useUserContext } from "./AuthProvider";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserContext();

  if (isLoading) {
    return <div className="flex-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  

  return children;
};

export default ProtectedRoute;