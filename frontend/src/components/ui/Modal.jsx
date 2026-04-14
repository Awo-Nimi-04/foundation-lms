import { useEffect } from "react";

export default function Modal({ show, onClose, onResend }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative bg-stone-900 text-stone-200 p-6 rounded-xl shadow-2xl w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute right-3 top-0 text-white p-1 text-center cursor-pointer"
          onClick={onClose}
        >
          <i className="bi bi-x-circle-fill"></i>
        </div>
        <h2 className="text-xl mb-3 text-center">Email Not Verified</h2>
        <p className="text-center mb-6">
          Please verify your email before logging in.
        </p>
        <button
          onClick={onResend}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  );
}
