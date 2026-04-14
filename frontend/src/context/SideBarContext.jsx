import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";

const SidebarContext = createContext();

function deriveSidebarState(pathname) {
  if (pathname.includes("all_courses")) {
    return "all_courses";
  }
  const parts = pathname.split("/");

  if (parts[2] === "courses") {
    return "courses";
  }

  if (parts[2] === "course") {
    if (parts[4] === "quizzes") {
      return "quizzes";
    }
    if (parts[4] === "study") {
      return "study";
    }
    if (parts[4] === "files") {
      return "files";
    }
    if (parts[4] === "assignments") {
      return "assignments";
    }
    if (parts[4] === "discussions" || parts[4] === "threads") {
      return "threads";
    }
  }

  return "unknown";
}

export function SidebarProvider({ children }) {
  const location = useLocation();

  const sidebarState = useMemo(() => {
    return deriveSidebarState(location.pathname);
  }, [location.pathname]);

  return (
    <SidebarContext.Provider value={{ sidebarState }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
