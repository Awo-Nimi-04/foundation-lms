import { createContext, useContext, useEffect, useState } from "react";

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [currentCourse, setCurrentCourse] = useState(null);

  useEffect(() => {
    const loadCourse = async () => {
      const courseID = Number(localStorage.getItem("course"));

      if (!courseID) return;

      setCurrentCourse({ id: courseID });
    };

    loadCourse();
  }, []);

  return (
    <CourseContext.Provider value={{ currentCourse, setCurrentCourse }}>
      {children}
    </CourseContext.Provider>
  );
}

export const useCourse = () => {
  return useContext(CourseContext);
};
