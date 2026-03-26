export default function Card({
  title,
  children,
  footer,
  customStyles,
  headerStyles,
}) {
  return (
    <div className={`bg-gray-700 ${customStyles} shadow-xl rounded-lg px-4`}>
      {title && (
        <div className={`${headerStyles} text-xl text-stone-200 p-2 font-bold`}>
          <h3>{title}</h3>
        </div>
      )}

      <div className="">{children}</div>

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}
