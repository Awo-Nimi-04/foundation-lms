import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourse } from "../context/CoursecONTEXT.JSX";

export default function Register() {
  const { login } = useAuth();
  const { setCurrentCourse } = useCourse();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await api.post("/auth/register", { email, password, role });
      login(res.data.access_token, {
        id: res.data.user_id,
        role: role,
        email: email,
      });
      setCurrentCourse({ id: 1 });

      if (role === "student") {
        navigate("/student/assignments");
      } else {
        navigate("/instructor/course/1/assignments");
      }
    } catch (err) {
      alert("Failed to register user!");
      console.log(err.message);
    }
  };

  return (
    <div>
      <h2>Create Account</h2>
      <div className="flex flex-col">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
      </select>

      <button onClick={handleRegister}>Create Account</button>
    </div>
  );
}
