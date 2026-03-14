import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* ######### STUDENT ROUTES ######### */}
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute role={"student"}>
            <AssignmentList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/assignments/:id/submit"
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
        path="/student/quizzes/${quiz.id}/quiz_attempts"
        element={
          <ProtectedRoute role={"student"}>
            <QuizAttemptsList />
          </ProtectedRoute>
        }
      />

      {/* ######### INSTRUCTOR ROUTES ######### */}
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
  );
}

export default App;
