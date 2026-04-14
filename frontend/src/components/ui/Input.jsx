import { useState } from "react";

export default function Input({
  placeholder,
  type = "text",
  value,
  onChange,
  label,
  customStyles,
  name,
  checked,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const displayType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-stone-300 font-medium text-left">
          {label}
        </label>
      )}

      {!isPassword && (
        <input
          className={`p-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${customStyles}`}
          placeholder={placeholder}
          type={displayType}
          value={value}
          onChange={onChange}
          min={type === "number" ? 0 : undefined}
          name={name}
          checked={checked}
        />
      )}

      {isPassword && (
        <div className="relative">
          <input
            className={`w-full p-2 pr-10 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${customStyles}`}
            placeholder={placeholder}
            type={displayType}
            value={value}
            onChange={onChange}
            min={type === "number" ? 0 : undefined}
            name={name}
            checked={checked}
          />

          <button
            type="button"
            disabled={!value}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-stone-400 hover:text-white disabled:text-stone-400"
          >
            {!showPassword ? (
              <i className="bi bi-eye" />
            ) : (
              <i className="bi bi-eye-slash" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
