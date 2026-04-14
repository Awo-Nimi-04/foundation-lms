import { createContext, useContext, useEffect, useState } from "react";

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [currentCourse, setCurrentCourse] = useState(null);

  return (
    <CourseContext.Provider value={{ currentCourse, setCurrentCourse }}>
      {children}
    </CourseContext.Provider>
  );
}

export const useCourse = () => {
  return useContext(CourseContext);
};
