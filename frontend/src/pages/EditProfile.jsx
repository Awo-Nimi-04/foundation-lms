import { useState } from "react";
import BackButton from "../components/ui/BackButton";
import PageHeading from "../components/ui/PageHeading";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import OTPInput from "../components/ui/OTPInput";

export default function EditProfile() {
  const { user, login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [preview, setPreview] = useState(user.photo || null);
  const [file, setFile] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Handle image selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  // Handle password input
  const handlePasswordChange = (e, name) => {
    setPasswords({
      ...passwords,
      [name]: e.target.value,
    });
  };

  const handleUpdateProfilePhoto = async () => {
    if (!file) return;
    const formData = new FormData();

    if (file) formData.append("file", file);
    showLoading("Updating your profile . . .");
    try {
      const res = await api.patch("/auth/update_user_photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      login(res.data.access_token, res.data.user);
      hideLoading();
      alert("Profile update successfully!");
    } catch (err) {
      console.error(err);
      hideLoading();
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new) return;
    const formData = new FormData();

    if (passwords.current)
      formData.append("current_password", passwords.current);
    if (passwords.new) formData.append("new_password", passwords.new);
    showLoading("Updating your profile . . .");
    try {
      const res = await api.patch("/auth/update_password", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
      hideLoading();
      alert("Password changed successfully!");
    } catch (err) {
      console.error(err);
      hideLoading();
    }
  };

  const handleRequestOtp = async () => {
    try {

      await api.get("/auth/send-otp");
      setShowOtpInput(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await api.post("/auth/verify-otp", { otp });
      setOtpVerified(true);
      setShowOtpInput(false);
    } catch (err) {
      console.error(err);
      alert("OTP verification failed!")
    }
  };

  return (
    <div
      className={`relative flex flex-col min-h-screen items-center text-stone-300`}
    >
      {showOtpInput && (
        <div className="absolute z-50 bg-black/50 w-full h-full p-3">
          <div className="mx-auto bg-gray-700 p-5 flex flex-col justify-between items-center md:w-100 md:h-100 w-[80%] h-[40%] rounded-lg shadow-xl">
            <div>
              <p className="text-4xl text-stone-200 p-2 font-bold text-center">
                Enter OTP
              </p>
              <p className="italic text-yellow-400 text-lg text-center">
                Please enter the one-time passcode sent to your phone via SMS
              </p>
            </div>
            <OTPInput onChange={(value) => setOtp(value)} />
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
          </div>
        </div>
      )}
      <div className="absolute left-5 top-5">
        <BackButton />
      </div>
      <div className="mt-5">
        <PageHeading>Edit Profile</PageHeading>
      </div>

      {/* ================= PROFILE PICTURE ================= */}
      <Card
        customStyles={"my-5 py-5 w-80 text-center"}
        title={"Update Profile Picture"}
      >
        <div className="flex items-center gap-4">
          <img
            src={
              preview ||
              "https://upload.wikimedia.org/wikipedia/commons/b/b5/Windows_10_Default_Profile_Picture.svg"
            }
            alt="preview"
            className="w-20 h-20 rounded-full object-cover border"
          />

          {!file && (
            <div className="flex flex-col space-y-1">
              <label className="inline-block">
                <span className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-500 transition">
                  Select a Photo
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
          {file && (
            <div className="w-full flex space-x-2 items-center justify-between">
              <div className="space-x-2">
                <Button variant="secondary" onClick={handleUpdateProfilePhoto}>
                  Upload File
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => {
                    setFile(null);
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ================= PASSWORD CHANGE ================= */}
      {!otpVerified && (
        <Button
          customStyles={"w-80"}
          variant="primary"
          onClick={handleRequestOtp}
        >
          Change Password
        </Button>
      )}
      {otpVerified && (
        <Card
          title={"Change Password"}
          customStyles={"py-4 w-80 text-center"}
          footer={
            <div className="px-2">
              <Button
                customStyles={"w-full"}
                variant="secondary"
                onClick={handleUpdatePassword}
              >
                Confirm Password Change
              </Button>
            </div>
          }
        >
          <div className="space-y-3 p-2">
            <Input
              type="password"
              placeholder="Current Password"
              value={passwords.current}
              onChange={(e) => handlePasswordChange(e, "current")}
            />

            <Input
              type="password"
              placeholder="New Password"
              value={passwords.new}
              onChange={(e) => handlePasswordChange(e, "new")}
            />

            <Input
              type="password"
              placeholder="Confirm New Password"
              value={passwords.confirm}
              onChange={(e) => handlePasswordChange(e, "confirm")}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
