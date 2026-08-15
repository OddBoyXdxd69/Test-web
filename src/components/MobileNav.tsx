import { NavLink } from "react-router-dom";
import { Home, Compass, Library, BarChart3 } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/library", label: "Library", icon: Library },
  { to: "/studio", label: "Studio", icon: BarChart3 },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-panel/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-white" : "text-t-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} className={isActive ? "text-yt-red" : ""} strokeWidth={isActive ? 2.4 : 2} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
