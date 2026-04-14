import { useEffect, useRef, useState } from "react";

export default function OTPInput({ length = 6, onChange }) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    const otpValue = otp.join("");
    onChange?.(otpValue);
  }, [otp]);

  const handleChange = (value, index) => {
    const digit = value.slice(-1); // always take last character

    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move forward if a digit was entered
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move back on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    const newOtp = pasteData.split("");
    const paddedOtp = [...newOtp, ...Array(length - newOtp.length).fill("")];

    setOtp(paddedOtp);

    // Focus last filled input
    const lastIndex = newOtp.length - 1;
    if (lastIndex >= 0) {
      inputsRef.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          value={digit}
          ref={(el) => (inputsRef.current[index] = el)}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-8 h-8 md:w-14 md:h-16 text-center border border-stone-200 text-stone-200 rounded text-2xl focus:border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      ))}
    </div>
  );
}
