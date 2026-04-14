export default function InnerCard({
  title,
  titleColor = "text-stone-200",
  children,
  footer,
  customStyles,
}) {
  return (
    <div
      className={`relative bg-gray-900 border-2 border-stone-200 shadow-md ${customStyles} rounded-lg p-4`}
    >
      {title && (
        <div className={`text-md ${titleColor} mb-2 text-center font-semibold`}>
          <h4>{title}</h4>
        </div>
      )}

      <div className="text-stone-300 space-y-2">{children}</div>

      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
