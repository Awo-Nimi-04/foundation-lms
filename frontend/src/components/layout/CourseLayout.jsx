import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import api from "../../api/api";
import { useCourse } from "../../context/CourseContext";

export default function CourseLayout() {
  const { courseId } = useParams();
  const { setCurrentCourse } = useCourse();

  useEffect(() => {
    if (!courseId) return;
    const loadCourse = async () => {
      const res = await api.get(`/courses/${courseId}`);

      setCurrentCourse({
        id: Number(courseId),
        title: res.data.title,
      });
    };

    loadCourse();
  }, [courseId]);

  return <Outlet />;
}
