export default function ListCard({ title, children, customStyles }) {
  return (
    <div
      className={`flex items-center justify-between  bg-gray-700 ${customStyles} shadow-xl rounded-lg p-2`}
    >
      {title && (
        <div className="text-xl text-stone-200 p-2 font-bold">
          <h3>{title}</h3>
        </div>
      )}

      <div className="">{children}</div>
    </div>
  );
}
