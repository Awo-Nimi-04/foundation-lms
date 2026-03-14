
export default function Card({ title, children, footer }) {
  return (
    <div className="">
      {title && (
        <div className="">
          <h3>{title}</h3>
        </div>
      )}

      <div className="">{children}</div>

      {footer && <div className="">{footer}</div>}
    </div>
  );
}
