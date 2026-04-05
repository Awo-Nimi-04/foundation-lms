export default function LoadingModal({ isOpen, message = "Loading..." }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative bg-stone-900 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-stone-600 border-t-blue-500 rounded-full animate-spin"></div>

        {/* Message */}
        <p className="text-stone-200 text-sm">{message}</p>
      </div>
    </div>
  );
}