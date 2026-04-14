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
import CourseMaterials from "./pages/student/CourseMaterials";
import Study from "./pages/student/Study";
import EditProfile from "./pages/EditProfile";
import CreateDiscussion from "./pages/instructor/CreateDiscussion";
import InstructorDiscussions from "./pages/instructor/InstructorDiscussions";
import InstructorDiscussionThread from "./pages/instructor/InstructorDiscussionThread";
import CourseDiscussionList from "./pages/student/CourseDiscussionList";
import StudentDiscussionThread from "./pages/student/StudentDiscussionThread";
import CourseLayout from "./components/layout/CourseLayout";
import GradeDiscussion from "./pages/instructor/GradeDiscussion";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <div className="bg-gradient-to-b from-stone-950 to-slate-900">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* ######### STUDENT ROUTES ######### */}

        <Route
          path="/student/edit_profile"
          element={
            <ProtectedRoute role={"student"}>
              <EditProfile />
            </ProtectedRoute>
          }
        />

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

        <Route path="/student/course/:courseId" element={<CourseLayout />}>
          <Route
            path="assignments"
            element={
              <ProtectedRoute role={"student"}>
                <AssignmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="quizzes"
            element={
              <ProtectedRoute role={"student"}>
                <CourseQuizList />
              </ProtectedRoute>
            }
          />

          <Route
            path="assignments/:assignmentId/submit"
            element={
              <ProtectedRoute role={"student"}>
                <SubmitAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/:quizId/attempt_quiz"
            element={
              <ProtectedRoute role={"student"}>
                <AttemptQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/:quizId/quiz_attempts"
            element={
              <ProtectedRoute role={"student"}>
                <QuizAttemptsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="study"
            element={
              <ProtectedRoute role={"student"}>
                <Study />
              </ProtectedRoute>
            }
          />

          <Route
            path="files"
            element={
              <ProtectedRoute role={"student"}>
                <CourseMaterials />
              </ProtectedRoute>
            }
          />

          <Route
            path="discussions"
            element={
              <ProtectedRoute>
                <CourseDiscussionList />
              </ProtectedRoute>
            }
          />

          <Route
            path="threads/:threadId"
            element={
              <ProtectedRoute role={"student"}>
                <StudentDiscussionThread />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ######### INSTRUCTOR ROUTES ######### */}
        <Route
          path="/instructor/edit_profile"
          element={
            <ProtectedRoute role={"instructor"}>
              <EditProfile />
            </ProtectedRoute>
          }
        />

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
        <Route path="/instructor/course/:courseId" element={<CourseLayout />}>
          <Route
            path="files"
            element={
              <ProtectedRoute role={"instructor"}>
                <CourseMaterialUpload />
              </ProtectedRoute>
            }
          />

          <Route
            path="assignments/:assignmentId/submissions"
            element={
              <ProtectedRoute role={"instructor"}>
                <ViewSubmissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="assignments/create"
            element={
              <ProtectedRoute role={"instructor"}>
                <CreateAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="assignments"
            element={
              <ProtectedRoute role={"instructor"}>
                <InstructorAssignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes"
            element={
              <ProtectedRoute role={"instructor"}>
                <InstructorQuizList />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/create"
            element={
              <ProtectedRoute role={"instructor"}>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/:quizId/quiz_editor"
            element={
              <ProtectedRoute role={"instructor"}>
                <QuizEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/:quizId/grade"
            element={
              <ProtectedRoute role={"instructor"}>
                <GradeQuizAttempt />
              </ProtectedRoute>
            }
          />

          <Route
            path="quizzes/:quizId/analytics"
            element={
              <ProtectedRoute role={"instructor"}>
                <QuizAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="discussions"
            element={
              <ProtectedRoute>
                <InstructorDiscussions />
              </ProtectedRoute>
            }
          />

          <Route
            path="discussions/create"
            element={
              <ProtectedRoute role={"instructor"}>
                <CreateDiscussion />
              </ProtectedRoute>
            }
          />

          <Route
            path="threads/:threadId"
            element={
              <ProtectedRoute role={"instructor"}>
                <InstructorDiscussionThread />
              </ProtectedRoute>
            }
          />

          <Route
            path="threads/:threadId/grade"
            element={
              <ProtectedRoute role={"instructor"}>
                <GradeDiscussion />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
