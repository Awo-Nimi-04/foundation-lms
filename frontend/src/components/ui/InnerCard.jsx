export default function InnerCard({ title, children, footer, customStyles }) {
  return (
    <div
      className={`bg-gray-900 border-2 border-stone-200 shadow-md ${customStyles} rounded-lg p-4`}
    >
      {title && (
        <div className="text-md text-stone-200 mb-2 text-center font-semibold">
          <h4>{title}</h4>
        </div>
      )}

      <div className="text-stone-300 space-y-2">{children}</div>

      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
