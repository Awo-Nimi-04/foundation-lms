import "./App.css";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoutes";
import AssignmentList from "./pages/student/AssignmentList";
import SubmitAssignment from "./pages/student/SubmitAssignment";
import ViewSubmissions from "./pages/instructor/ViewSubmissions";
import CreateAssignment from "./pages/instructor/CreateAssignment";
import InstructorAssignments from "./pages/instructor/InstructorAssignments";
import InstructorQuizList from "./pages/instructor/InstructorQuizList";
import CreateQuiz from "./pages/instructor/CreateQuiz";
import QuizEditor from "./pages/instructor/QuizEditor";
import AttemptQuiz from "./pages/student/AttemptQuiz";
import QuizAttemptsList from "./pages/student/QuizAttemptsList";
import CourseQuizList from "./pages/student/CourseQuizList";
import GradeQuizAttempt from "./pages/instructor/GradeQuizAttempt";
import QuizAnalytics from "./pages/instructor/QuizAnalytics";
import Register from "./pages/Register";
import InstructorCourseDashboard from "./pages/instructor/InstructorCourseDashboard";
import CreateCourse from "./pages/instructor/CreateCourse";
import CourseMaterialUpload from "./pages/instructor/CourseMaterialUpload";
import StudentCourseDashboard from "./pages/student/StudentCourseDashboard";
import EnrollCourses from "./pages/student/EnrollCourses";

function App() {
  return (
    <div className="bg-gradient-to-b from-stone-950 to-slate-900">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* ######### STUDENT ROUTES ######### */}
        <Route
          path="/student/all_courses"
          element={
            <ProtectedRoute role={"student"}>
              <EnrollCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/courses"
          element={
            <ProtectedRoute role={"student"}>
              <StudentCourseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId/assignments"
          element={
            <ProtectedRoute role={"student"}>
              <AssignmentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/assignments/:assignmentId/submit"
          element={
            <ProtectedRoute role={"student"}>
              <SubmitAssignment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseId/quizzes"
          element={
            <ProtectedRoute role={"student"}>
              <CourseQuizList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quizzes/:quizId/attempt_quiz"
          element={
            <ProtectedRoute role={"student"}>
              <AttemptQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quizzes/:quizId/quiz_attempts"
          element={
            <ProtectedRoute role={"student"}>
              <QuizAttemptsList />
            </ProtectedRoute>
          }
        />

        {/* ######### INSTRUCTOR ROUTES ######### */}
        <Route
          path="/instructor/courses"
          element={
            <ProtectedRoute role={"instructor"}>
              <InstructorCourseDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/create_course"
          element={
            <ProtectedRoute role={"instructor"}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/course/:courseId/files"
          element={
            <ProtectedRoute role={"instructor"}>
              <CourseMaterialUpload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/assignments/:assignmentId/submissions"
          element={
            <ProtectedRoute role={"instructor"}>
              <ViewSubmissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/assignments/create"
          element={
            <ProtectedRoute role={"instructor"}>
              <CreateAssignment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/course/:courseId/assignments"
          element={
            <ProtectedRoute role={"instructor"}>
              <InstructorAssignments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/course/:courseId/quizzes"
          element={
            <ProtectedRoute role={"instructor"}>
              <InstructorQuizList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/:courseId/quizzes/create"
          element={
            <ProtectedRoute role={"instructor"}>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/quizzes/:quizId/quiz_editor"
          element={
            <ProtectedRoute role={"instructor"}>
              <QuizEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/quizzes/:quizId/grade"
          element={
            <ProtectedRoute role={"instructor"}>
              <GradeQuizAttempt />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/quizzes/:quizId/analytics"
          element={
            <ProtectedRoute role={"instructor"}>
              <QuizAnalytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
