import { useEffect, useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useLoading } from "../context/LoadingContext";
import Modal from "../components/ui/Modal";

export default function Login() {
  const { login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogin = async () => {
    showLoading("Logging you in");
    try {
      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      login(res.data.access_token, res.data.user);
      if (res.data.user.role === "student") {
        navigate("/student/courses");
      } else {
        navigate("/instructor/courses");
      }
    } catch (err) {
      const errMessage =
        err.response?.data?.message || "Failed to log user in!";
      if (errMessage === "Not verified") {
        alert(
          "Your email has not been verified. Please check email to verify email.",
        );
        setShowModal(true);
      } else {
        alert("Login failed!");
      }
      console.log(errMessage);
    } finally {
      hideLoading();
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-verification", { email });
      alert("Verification email sent!");
    } catch {
      alert("Error sending email");
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center p-3">
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
            <Button
              customStyles={"w-full"}
              onClick={handleLogin}
              variant="primary"
            >
              Login
            </Button>
            <Link to={"/forgot-password"} className="text-blue-400 text-center p-2 hover:text-sky-300 underline ">Forgot password?</Link>
          </div>
        </div>
      </div>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        onResend={handleResend}
      />
    </div>
  );
}
