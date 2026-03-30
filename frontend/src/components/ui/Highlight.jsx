export default function Highlight({ children, customStyles }) {
  return (
    <span
      className={`p-2 text-md font-medium rounded-md bg-stone-900 text-stone-300 overflow-y-auto ${customStyles}`}
    >
      {children}
    </span>
  );
}
