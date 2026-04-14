import { Link } from "react-router-dom";
import { useCourse } from "../../context/CourseContext";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SideBarContext";

export default function SideBarContent({ onNavigate }) {
  const { currentCourse, setCurrentCourse } = useCourse();
  const { sidebarState } = useSidebar();
  const { user } = useAuth();
  const navStyle =
    "text-stone-200 hover:bg-gray-100 hover:text-stone-900 p-2 rounded";
  return (
    <div className="flex flex-col gap-3">
      {/* {console.log(sidebarState)} */}
      {user.role === "student" && (
        <>
          <Link
            to="/student/courses"
            onClick={() => {
              setCurrentCourse(null);
              onNavigate?.();
            }}
            className={`font-bold text-lg ${navStyle} ${sidebarState === "courses" ? "bg-gray-100 text-stone-900" : ""}`}
          >
            My Courses
          </Link>

          {currentCourse && (
            <>
              <Link
                to={`/student/course/${currentCourse.id}/assignments`}
                className={`${navStyle} ${sidebarState === "assignments" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Assignments
              </Link>
              <Link
                to={`/student/course/${currentCourse.id}/discussions`}
                className={`${navStyle} ${sidebarState === "discussions" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Discussions
              </Link>
              <Link
                to={`/student/course/${currentCourse.id}/quizzes`}
                className={`${navStyle} ${sidebarState === "quizzes" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Quizzes
              </Link>
              <Link
                to={`/student/course/${currentCourse.id}/study`}
                className={`${navStyle} ${sidebarState === "study" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Study
              </Link>
              <Link
                to={`/student/course/${currentCourse.id}/files`}
                className={`${navStyle} ${sidebarState === "files" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Files
              </Link>
            </>
          )}
          <Link
            to="/student/all_courses"
            className={`font-bold text-lg ${navStyle} ${sidebarState === "all_courses" ? "bg-gray-100 text-stone-900" : ""}`}
            onClick={() => {
              setCurrentCourse(null);
              onNavigate?.();
            }}
          >
            Register Courses
          </Link>
        </>
      )}

      {user.role === "instructor" && (
        <>
          <Link
            to="/instructor/courses"
            onClick={() => {
              setCurrentCourse(null);
              onNavigate?.();
            }}
            className={`font-bold text-lg ${navStyle} ${sidebarState === "courses" ? "bg-gray-100 text-stone-900" : ""}`}
          >
            My Courses
          </Link>
          {currentCourse && (
            <>
              <Link
                to={`/instructor/course/${currentCourse.id}/assignments`}
                className={`${navStyle} ${sidebarState === "assignments" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Assignments
              </Link>
              <Link
                to={`/instructor/course/${currentCourse.id}/discussions`}
                className={`${navStyle} ${sidebarState === "threads" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Discussions
              </Link>
              <Link
                to={`/instructor/course/${currentCourse.id}/quizzes`}
                className={`${navStyle} ${sidebarState === "quizzes" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Quizzes
              </Link>
              <Link
                to={`/instructor/course/${currentCourse.id}/files`}
                className={`${navStyle} ${sidebarState === "files" ? "bg-gray-100 text-stone-900" : ""}`}
                onClick={onNavigate}
              >
                Files
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
