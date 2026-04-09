import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourse } from "../../context/CourseContext";
import { useState } from "react";

export default function NavBar() {
  const { logout, user } = useAuth();
  const { setCurrentCourse } = useCourse();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-stone-800 shadow-md flex items-center px-6 z-50">
      {/* Left */}
      <div className="w-1/3 font-bold text-lg text-stone-300">
        <Link to={"/"}>Foundation</Link>
      </div>

      {/* Center */}
      <div className="w-1/3 text-center font-bold text-lg text-stone-300">
        Foundation {user.role}
      </div>

      {/* Right */}
      <div className="w-1/3 flex justify-end items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown((prev) => !prev)}
            className="cursor-pointer text-stone-300 p-1 rounded-sm"
          >
            <div className="flex items-center justify-between px-3 space-x-3">
              <img
                className="rounded-full w-10 h-10 object-cover border order-stone-200"
                src={
                  user.photo ||
                  "https://upload.wikimedia.org/wikipedia/commons/b/b5/Windows_10_Default_Profile_Picture.svg"
                }
              />
              <strong className="">
                {user.first_name} {user.last_name}
              </strong>
              {!showProfileDropdown ? (
                <i class="bi bi-caret-down-fill" />
              ) : (
                <i class="bi bi-caret-up-fill" />
              )}
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-3 top-10 mt-2 w-40 rounded-sm z-50 p-1 bg-gray-300 border-2 border-stone-200">
              <Link
                to={`/${user.role}/edit_profile`}
                onClick={() => {
                  setShowProfileDropdown(false);
                }}
                className="block rounded-sm p-2 hover:bg-blue-500 hover:text-white font-medium"
              >
                Edit Profile
              </Link>
              <Link
                to="/"
                onClick={() => {
                  setCurrentCourse(null);
                  setShowProfileDropdown(false);
                  logout();
                }}
                className="block p-2 text-red-700 hover:bg-blue-500 rounded-sm hover:text-white font-medium"
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
