const DEFAULT_PALETTE = [
  { name: "red", value: "#ef4444" }, // red
  { name: "orange", value: "#f97316" }, // orange
  { name: "yellow", value: "#eab308" }, // orange
  { name: "green", value: "#22c55e" }, // orange
  { name: "cyan", value: "#06b6d4" }, // orange
  { name: "blue", value: "#3b82f6" }, // orange
  { name: "purple", value: "#8b5cf6" }, // orange
  { name: "pink", value: "#ec4899" }, // orange
];
const colorStyles = {
  blue: { bg: "bg-blue-500", border: "border-blue-500" },
  green: { bg: "bg-green-500", border: "border-green-500" },
  red: { bg: "bg-red-500", border: "border-red-500" },
  yellow: { bg: "bg-yellow-500", border: "border-yellow-500" },
  orange: { bg: "bg-orange-500", border: "border-orange-500" },
  purple: { bg: "bg-purple-500", border: "border-purple-500" },
  gray: { bg: "bg-stone-500", border: "border-gray-500" },
  rose: { bg: "bg-rose-500", border: "border-rose-500" },
  mauve: { bg: "bg-mauve-500", border: "border-mauve-500" },
};

export default function ColorPicker({
  value,
  onChange,
  palette = DEFAULT_PALETTE,
  label = "Choose a color",
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-stone-300">{label}</label>
      )}

      <div className="flex flex-wrap gap-2">
        {palette.map((color) => {
          const isSelected = value === color.name;

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onChange?.(color.name)}
              className={`w-9 h-9 rounded-full border-2 transition 
                ${
                  isSelected
                    ? "border-white scale-110 shadow-md"
                    : "border-transparent hover:scale-105"
                }`}
              style={{ backgroundColor: color.name }}
              aria-label={`Select color ${color.name}`}
            />
          );
        })}
      </div>

      {value && (
        <div className="text-xs text-stone-400">
          Selected: <span style={{ color: value }}>{value}</span>
        </div>
      )}
    </div>
  );
}
