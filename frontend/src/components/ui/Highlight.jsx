export default function Highlight({ children, customStyles }) {
  return (
    <div
      className={`p-2 text-md font-medium rounded-md bg-stone-900 text-stone-300 overflow-y-auto max-h-40 md:max-h-80 ${customStyles}`}
    >
      {children}
    </div>
  );
}
