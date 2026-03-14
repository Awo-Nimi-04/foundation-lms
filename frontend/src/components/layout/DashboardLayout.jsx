import NavBar from "./NavBar";
import SideBar from "./SideBar";

export default function DashboardLayout({ children }) {
  return (
    <div className="">
      <NavBar />

      <div className="">
        <SideBar />

        <div className="">{children}</div>
      </div>
    </div>
  );
}
