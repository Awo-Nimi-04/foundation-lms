import { useCourse } from "../../context/CourseContext";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Drawer from "./Drawer";
import SideBarContent from "./SideBarContent";

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const { currentCourse, setCurrentCourse } = useCourse();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!location.pathname.includes("/course/")) {
      setCurrentCourse(null);
    }
  }, [location.pathname]);

  return (
    <div>
      <NavBar setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex">
        <div className="hidden md:block">
          <SideBar />
        </div>
        <Drawer
          isOpen={isSidebarOpen}
          handleClose={() => setIsSidebarOpen(false)}
        >
          <SideBarContent onNavigate={() => setIsSidebarOpen(false)} />
        </Drawer>
        <div
          className={`bg-gradient-to-b from-stone-950 to-slate-900 min-h-screen md:pt-16 md:ml-64 md:w-[calc(100%-16rem)] w-full mt-20`}
        >
          {currentCourse && (
            <p className="text-blue-300 text-center text-xl font-semibold italic">{currentCourse.title}</p>
          )}
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
