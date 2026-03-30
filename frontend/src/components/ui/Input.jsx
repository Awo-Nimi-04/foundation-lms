export default function Input({
  placeholder,
  type,
  value,
  onChange,
  label,
  customStyles,
  name,
  checked,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-stone-300 font-medium text-left">
          {label}
        </label>
      )}

      <input
        className={`p-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${customStyles}`}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        min={type === "number" ? 0 : null}
        name={name}
        checked={checked}
      />
    </div>
  );
}
