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
    secondary: "bg-green-700 hover:bg-green-900 text-md p-2 text-stone-200",
    tertiary: "bg-amber-400 hover:bg-yellow-500/75 text-stone-800 p-2",
    danger:
      "bg-transparent px-2 py-1 border-2 border-red-700 text-red-500 hover:bg-red-900 hover:border-red-900 hover:text-stone-200 font-medium",
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
