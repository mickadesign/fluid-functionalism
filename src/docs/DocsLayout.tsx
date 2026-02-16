import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../lib/utils";
import { fontWeights } from "../lib/font-weight";
import { componentList } from "./components";

export function DocsLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-border/60 overflow-y-auto p-4 hidden md:block">
        <NavLink
          to="/docs"
          end
          className="block text-[16px] text-foreground mb-6 px-2 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          Components
        </NavLink>
        <nav className="flex flex-col gap-0.5">
          {componentList.map((c) => (
            <NavLink
              key={c.slug}
              to={`/docs/${c.slug}`}
              className={({ isActive }) =>
                cn(
                  "px-2 py-1.5 rounded-lg text-[13px] outline-none transition-colors duration-80",
                  "focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
                  isActive
                    ? "bg-accent/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
              style={({ isActive }) => ({
                fontVariationSettings: isActive
                  ? fontWeights.semibold
                  : fontWeights.normal,
              })}
            >
              {c.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur border-b border-border/60 px-4 py-3">
        <NavLink
          to="/docs"
          className="text-[14px] text-foreground outline-none"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          Components
        </NavLink>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 py-10 md:px-12 md:py-16 md:max-w-3xl mt-12 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}
