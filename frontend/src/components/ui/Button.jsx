export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  customStyles,
}) {
    const styleDict = {
        "primary": "bg-sky-500/100 hover:bg-sky-500/75 text-xl",
        "secondary": "bg-green-700 hover:bg-green-900 text-md",
        "tertiary": "bg-amber-400 hover:bg-yellow-500/75 text-stone-800",
        "danger": "bg-red-600 hover:bg-red-900 text-xl",
    }
  return (
    <button
      className={`${styleDict[variant]} ${customStyles} shadow-xl text-stone-200 cursor-pointer rounded-lg p-2 `}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
