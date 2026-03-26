export default function Select({
  value,
  onChange,
  label,
  customStyles,
  children,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-stone-300 font-medium text-left">
          {label}
        </label>
      )}

      <select
        className={`p-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${customStyles}`}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}
