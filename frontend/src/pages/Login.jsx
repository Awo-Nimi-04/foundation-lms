import { useEffect, useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useLoading } from "../context/LoadingContext";

export default function Login() {
  const { login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    showLoading("Logging you in");
    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });
      login(res.data.access_token, res.data.user);
      if (res.data.user.role === "student") {
        navigate("/student/courses");
      } else {
        navigate("/instructor/courses");
      }
    } catch (err) {
      alert("Login failed!");
      console.log(err.message);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center">
      <div className="m-auto">
        <h2 className="text-center text-4xl text-stone-200 mb-6">
          Welcome to Foundation
        </h2>
        <div className="flex flex-col space-y-2 bg-stone-950 p-4 h-100 rounded-xl shadow-2xl justify-between border border-stone-400">
          <div className="mt-8">
            <h2 className="text-stone-200 text-center shadow-xl text-2xl">
              Login
            </h2>
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
