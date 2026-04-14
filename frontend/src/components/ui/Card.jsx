export default function Card({
  title,
  children,
  footer,
  headerDecor,
  customStyles,
  headerStyles,
}) {
  return (
    <div
      className={`bg-gray-700 shadow-xl rounded-lg px-4 flex flex-col ${customStyles}`}
    >
      {title && (
        <div
          className={`${headerStyles} text-xl text-stone-200 p-2 font-bold sticky top-0 bg-gray-700 z-10`}
        >
          <h2 className="text-sm font-semibold text-yellow-600">{headerDecor}</h2>
          <h3>{title}</h3>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">{children}</div>

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}
