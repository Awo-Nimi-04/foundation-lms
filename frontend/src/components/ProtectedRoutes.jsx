import { Navigate } from "react-router-dom";
import DashboardLayout from "./layout/Dashboardlayout";
import { useAuth } from "../context/AuthContext";

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
