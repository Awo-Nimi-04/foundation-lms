import { useAuth } from "../../context/AuthContext";
import SideBarContent from "./SideBarContent";

export default function SideBar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-600/50 shadow-xl p-4 z-40">
      <SideBarContent />
    </div>
  );
}
