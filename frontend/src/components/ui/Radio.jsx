export default function Radio({
  name,
  value,
  checked,
  onChange,
  children,
  customStyles,
}) {
  return (
    <label
      className={`p-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-100 text-left transition ${customStyles}`}
      style={{ display: "block" }}
    >
      <input
        className="mr-3"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {children}
    </label>
  );
}
