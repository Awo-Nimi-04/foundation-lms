import { useState } from "react";
import BackButton from "../components/ui/BackButton";
import PageHeading from "../components/ui/PageHeading";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";

export default function EditProfile() {
  const { user, login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [preview, setPreview] = useState(user.photo || null);
  const [file, setFile] = useState(null);

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
  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();

    if (file) formData.append("file", file);
    if (passwords.current)
      formData.append("current_password", passwords.current);
    if (passwords.new) formData.append("new_password", passwords.new);
    showLoading("Updating your profile . . .");
    try {
      const res = await api.patch("/auth/edit_user", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      login(res.data.access_token, res.data.user);
      hideLoading()
      alert("Profile update successfully!")
    } catch (err) {
      console.error(err);
      hideLoading();
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen items-center text-stone-300">
      {/* {console.log(user)} */}
      <div className="absolute left-10 top-5">
        <BackButton />
      </div>
      <div className="mt-12">
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
                <Button variant="secondary" onClick={handleUpdateProfile}>
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
      <Card
        title={"Change Password"}
        customStyles={"py-4 w-80 text-center"}
        footer={
          <Button
            customStyles={"w-full"}
            variant="secondary"
            onClick={handleUpdateProfile}
          >
            Update Password
          </Button>
        }
      >
        <div className="space-y-3">
          <Input
            type="password"
            // name="current"
            placeholder="Current Password"
            value={passwords.current}
            onChange={handlePasswordChange}
          />

          <Input
            type="password"
            // name="new"
            placeholder="New Password"
            value={passwords.new}
            onChange={handlePasswordChange}
          />

          <Input
            type="password"
            // name="confirm"
            placeholder="Confirm New Password"
            value={passwords.confirm}
            onChange={handlePasswordChange}
          />
        </div>
      </Card>
    </div>
  );
}
