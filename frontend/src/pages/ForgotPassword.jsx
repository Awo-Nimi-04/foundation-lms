import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useState } from "react";
import OTPInput from "../components/ui/OTPInput";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/ui/BackButton";

export default function ForgotPassword() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleRequestOtp = async () => {
    try {
      await api.post("auth/otp-login", { otp, email });
      setShowOtpInput(true);
      setErrorMessage("");
    } catch (err) {
      const error = err.response?.data?.error || "Something went wrong.";
      setErrorMessage(error);
      console.log(err);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await api.post("/auth/verify-otp-login", { otp, email });
      login(res.data.access_token, res.data.user);
      if (res.data.user.role === "student") {
        navigate("/student/courses");
      } else {
        navigate("/instructor/courses");
      }
    } catch (err) {
      const error = err.response?.data?.error || "Something went wrong.";
      setErrorMessage(error);
      console.error(err);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen items-center p-3">
      <div className="absolute top-11 left-5">
        <BackButton />
      </div>
      {showOtpInput && (
        <div className="absolute z-50 bg-black/50 w-full h-full p-3">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mx-auto mt-20 bg-gray-700 p-5 flex flex-col justify-between items-center md:w-100 md:h-100 w-[80%] h-[40%] rounded-lg shadow-xl"
            >
              <div>
                <p className="text-4xl text-stone-200 p-2 font-bold text-center">
                  Enter OTP
                </p>
                <p className="italic text-yellow-400 text-lg text-center">
                  Please enter the one-time passcode sent to your phone via SMS
                </p>
              </div>
              <div>
                <OTPInput onChange={(value) => setOtp(value)} />
                {errorMessage && (
                  <p className="text-sm text-red-500 text-left italic">
                    {errorMessage}
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  customStyles={"w-20"}
                  variant="secondary"
                  onClick={handleVerifyOtp}
                >
                  Verify
                </Button>
                <Button
                  customStyles={"w-20"}
                  variant="tertiary"
                  onClick={() => setShowOtpInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      <h1 className="mt-10 mb-10 text-blue-400 font-medium text-md italic">
        Foundation LMS
      </h1>
      <div className="bg-gray-700 p-4 rounded-md shadow-xl w-[100%] md:w-[50%]">
        <h1 className="text-center text-lg font-semibold text-stone-300">
          Forgot your password?
        </h1>
        <p className="text-yellow-400 text-center md:text-left">
          Please provide your email. A one-time passcode will be sent to your
          email if you have an account.
        </p>
        <div className="w-full mx-auto mt-5 text-center">
          <Input
            label={"Your email"}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errorMessage && (
            <p className="text-sm text-red-500 text-left">{errorMessage}</p>
          )}
          <button
            onClick={handleRequestOtp}
            className="mt-3 w-40 bg-violet-600 p-2 text-stone-300 font-semibold rounded-md shadow-lg cursor-pointer hover:bg-violet-700"
          >
            Get OTP
          </button>
        </div>
      </div>
    </div>
  );
}
