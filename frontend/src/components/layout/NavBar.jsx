export default function NavBar() {
  const role = localStorage.getItem("role");

  return (
    <div className="">
      <h2 className="">Foundation ({role})</h2>
    </div>
  );
}
