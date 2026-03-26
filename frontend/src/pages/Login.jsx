import { useEffect, useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourse } from "../context/CoursecONTEXT.JSX";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
  const { login } = useAuth();
  const { setCurrentCourse } = useCourse();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token, res.data.user);
      setCurrentCourse({ id: 1 });
      if (res.data.user.role === "student") {
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
    <div className="flex flex-col min-h-screen items-center">
      <div className="m-auto">
        <h2 className="text-center text-4xl text-stone-200 mb-6">
          Welcome to Foundation
        </h2>
        <div className="flex flex-col space-y-2 bg-stone-950 p-4 h-100 rounded-xl shadow-2xl justify-between">
          <div className="mt-8">
            <h2 className="text-stone-200 text-center shadow-xl text-2xl">Login</h2>
            <p className="text-stone-200 text-center">
              Don't have an account?{" "}
              <Link className="text-center text-indigo-500" to={"/register"}>
                Sign up
              </Link>
            </p>
          </div>
          <div className="flex flex-col space-y-6">
            <Input
              placeholder={"Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder={"Password"}
              type={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col mb-12">
            <Button onClick={handleLogin} variant="primary">
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
