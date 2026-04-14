export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  customStyles,
}) {
  const styleDict = {
    primary: "bg-blue-500 hover:bg-blue-500/75 text-lg p-2 text-stone-200",
    secondary: "bg-green-600 hover:bg-green-700 text-md p-2 text-stone-200",
    tertiary: "bg-amber-400 hover:bg-yellow-500/75 text-stone-800 p-2",
    danger:
      "bg-red-600 p-2 text-stone-200 hover:bg-red-600/75 hover:text-stone-300 font-medium",
  };
  return (
    <button
      className={`${styleDict[variant]} ${customStyles} shadow-xl cursor-pointer rounded-lg select-none disabled:bg-stone-600 disabled:text-stone-200 disabled:cursor-default`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
