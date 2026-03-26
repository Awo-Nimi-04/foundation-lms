export default function Label({ children, color = "blue" }) {
  const colorStyles = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    red: "text-red-400 bg-red-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    gray: "text-stone-300 bg-stone-500/10",
  };

  return (
    <span
      className={`px-2 py-1 text-sm font-semibold rounded-md ${colorStyles[color]}`}
    >
      {children}
    </span>
  );
}