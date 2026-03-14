import { useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "student") {
        navigate("/student/assignments");
      } else {
        navigate("/instructor/course/1/assignments");
      }
    } catch (err) {
      alert("Login failed!");
      console.log(err.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
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
      <div className="flex flex-col">
        <button onClick={handleLogin}>Login</button>
        <Link to={"/register"}>Create an Account Today</Link>
      </div>
    </div>
  );
}
