export default function TabButton({ options, selectedOption, onChange }) {
  return (
    <div className="flex bg-stone-900 p-1 rounded-lg w-fit space-x-1 select-none">
      {options.map((option) => {
        const isActive = option === selectedOption;

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-4 py-2 rounded-md text-sm transition ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
