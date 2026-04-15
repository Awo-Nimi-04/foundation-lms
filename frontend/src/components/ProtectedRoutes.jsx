import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "./layout/DashboardLayout"

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to={"/"} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={"/"} />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
