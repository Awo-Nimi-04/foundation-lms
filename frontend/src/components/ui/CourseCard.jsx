export default function CourseCard({
  title,
  onClick,
  color = "blue",
  footer,
  customStyles,
  label,
  invert = false,
}) {
  const colorStyles = {
    red: {
      bg: "bg-red-500",
      border: "hover:border-red-500",
      text: "text-red-500",
    },
    orange: {
      bg: "bg-orange-500",
      border: "hover:border-orange-500",
      text: "text-orange-500",
    },
    purple: {
      bg: "bg-purple-500",
      border: "hover:border-purple-500",
      text: "text-purple-500",
    },
    teal: {
      bg: "bg-teal-500",
      border: "hover:border-teal-500",
      text: "text-teal-500",
    },
    rose: {
      bg: "bg-rose-500",
      border: "hover:border-rose-500",
      text: "text-rose-500",
    },
    sky: {
      bg: "bg-sky-500",
      border: "hover:border-sky-500",
      text: "text-sky-500",
    },
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg shadow-xl overflow-hidden ${invert ? colorStyles[color].bg : "bg-gray-700"} ${customStyles} ${onClick && `border-3  border-stone-950  cursor-pointer`} ${colorStyles[color].border} transition`}
      onClick={onClick}
    >
      {label && <div className="absolute top-2 right-2 z-10">{label}</div>}
      <div
        className={`h-[55%] ${!invert ? colorStyles[color].bg : "bg-gray-700"}`}
      />

      <div className="flex flex-col flex-1 p-4 space-y-3 h-[45%]">
        {title && <h2 className="text-xl font-bold text-stone-100">{title}</h2>}

        <div className={`${colorStyles[color].text}`}>{footer}</div>
      </div>
    </div>
  );
}
