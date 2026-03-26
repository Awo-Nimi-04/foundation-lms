import NavBar from "./NavBar";
import SideBar from "./SideBar";

export default function DashboardLayout({ children }) {
  return (
    <div>
      <NavBar />
      <div className="flex">
        <SideBar />
        <div className="bg-gradient-to-b from-stone-950 to-slate-900 min-h-screen pt-16 ml-64 w-[calc(100%-16rem)] p-6">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
