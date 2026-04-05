import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourse } from "../../context/CourseContext";

export default function NavBar() {
  const { logout, user } = useAuth();
  const { setCurrentCourse } = useCourse();

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-md flex items-center px-6 z-50">
      {/* Left */}
      <div className="w-1/3 font-bold text-lg">
        <Link to={"/"}>Foundation</Link>
      </div>

      {/* Center */}
      <div className="w-1/3 text-center font-bold text-lg">
        Foundation {user.role}
      </div>

      {/* Right */}
      <div className="w-1/3 flex justify-end items-center gap-4">
        <p>Logged in as: {user.email}</p>
        <Link
          to="/"
          onClick={() => {
            setCurrentCourse(null);
            logout();
          }}
          className="text-blue-500 hover:underline"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}
