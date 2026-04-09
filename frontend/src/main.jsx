import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CourseProvider } from "./context/CoursecONTEXT.JSX";
import { LoadingProvider } from "./context/LoadingContext.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CourseProvider>
        <BrowserRouter>
          <LoadingProvider>
            <App />
          </LoadingProvider>
        </BrowserRouter>
      </CourseProvider>
    </AuthProvider>
  </StrictMode>,
);
