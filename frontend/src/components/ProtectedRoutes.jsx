import { Navigate } from "react-router-dom";
import DashboardLayout from "./layout/Dashboardlayout";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to={"/"} />;
  }

  if (role && userRole !== role) {
    return <Navigate to={"/"} />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
