import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourse } from "../../context/CourseContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar({ setIsSidebarOpen }) {
  const { logout, user } = useAuth();
  const { setCurrentCourse } = useCourse();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-stone-800 shadow-md flex items-center justify-between px-4 md:px-6 z-50">
      {/* LEFT */}
      <div className="flex items-center gap-3 text-stone-300 font-bold text-lg">
        {/* Hamburger (mobile only) */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden text-2xl"
        >
          <i className="bi bi-list"></i>
        </button>

        <Link to="/">Foundation</Link>
      </div>

      {/* CENTER (hide on small screens) */}
      <div className="hidden md:block text-center font-bold text-lg text-stone-300">
        Foundation {user.role}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown((prev) => !prev)}
            className="cursor-pointer text-stone-300 p-1 rounded-sm"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <img
                className="rounded-full w-8 h-8 md:w-10 md:h-10 object-cover border border-stone-200"
                src={
                  user.photo ||
                  "https://upload.wikimedia.org/wikipedia/commons/b/b5/Windows_10_Default_Profile_Picture.svg"
                }
              />

              {/* Hide name on mobile */}
              <div className="flex items-center space-x-1">
                <strong className="hidden md:block">
                  {user.first_name} {user.last_name}
                </strong>
                {!showProfileDropdown ? (
                  <i className="bi bi-caret-down-fill" />
                ) : (
                  <i className="bi bi-caret-up-fill" />
                )}
              </div>
            </div>
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-12 w-40 rounded-sm z-50 p-1 bg-gray-300 border-2 border-stone-200"
              >
                <Link
                  to={`/${user.role}/edit_profile`}
                  onClick={() => setShowProfileDropdown(false)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
