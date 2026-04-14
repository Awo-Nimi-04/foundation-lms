export default function Drawer({ isOpen, handleClose, children }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-60 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-700 shadow-xl p-4 z-70 
        transform transition-transform duration-300 md:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button onClick={handleClose} className="text-white mb-4 text-lg">
          ✕
        </button>

        {children}
      </div>
    </>
  );
}
