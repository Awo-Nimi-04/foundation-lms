import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { CourseProvider } from "./context/CoursecONTEXT.JSX";
import { LoadingProvider } from "./context/LoadingContext.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { SidebarProvider } from "./context/SideBarContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <CourseProvider>
            <LoadingProvider>
              <App />
            </LoadingProvider>
          </CourseProvider>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
