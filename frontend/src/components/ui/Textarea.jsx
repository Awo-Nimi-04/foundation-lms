export default function Textarea({
  placeholder,
  value,
  onChange,
  label,
  customStyles,
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm text-stone-300 font-medium">{label}</label>
      )}
      <textarea
        className={`p-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${customStyles}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
