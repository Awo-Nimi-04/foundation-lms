export default function ListCard({ title, subtitle, children, customStyles }) {
  return (
    <div
      className={`flex items-center justify-between  bg-gray-700 ${customStyles} shadow-xl rounded-lg px-2 py-1`}
    >
      {title && (
        <div className="text-xl text-stone-200 p-2 font-bold">
          <h3>{title}</h3>
          {subtitle}
        </div>
      )}

      <div className="">{children}</div>
    </div>
  );
}
