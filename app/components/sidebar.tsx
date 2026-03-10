"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { componentList } from "@/lib/docs/components";
import { Monitor, Sun, Moon, RectangleHorizontal, Circle } from "lucide-react";
import { cn } from "@/registry/default/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/registry/default/select";
import {
  useShapeContext,
  type ShapeVariant,
} from "@/registry/default/lib/shape-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { Tooltip } from "@/registry/default/tooltip";

interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "shrink-0 w-56 border-r border-border/60 overflow-y-auto p-4 flex flex-col gap-4",
        mobile
          ? "w-full border-r-0"
          : "sticky top-0 h-screen hidden md:flex"
      )}
    >
      <Link
        href="/"
        className="block text-[16px] text-foreground mb-2 px-2 py-1 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Fluid Functionalism
      </Link>

      {/* Top-level navigation */}
      <NavMenu activeSlug={pathname === "/" ? "/" : null} aria-label="Main navigation">
        <NavItem index={0} href="/" label="Showcase" />
      </NavMenu>

      {/* Components section */}
      <div>
        <span className="text-[13px] text-muted-foreground pl-1 py-4 block">
          Components
        </span>
        <NavMenu activeSlug={pathname} aria-label="Component navigation">
          {componentList.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i}
              href={`/docs/${c.slug}`}
              label={c.name}
            />
          ))}
        </NavMenu>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <SidebarSettings />
        <p className="text-[13px] text-muted-foreground px-2 mt-2">
          Designed by{" "}
          <a
            href="https://x.com/micka_design"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-muted-foreground hover:text-foreground transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2"
          >
            @micka_design
          </a>
        </p>
      </div>
    </aside>
  );
}

const themeOptions: { label: string; value: Theme; icon: typeof Monitor }[] = [
  { label: "System", value: "system", icon: Monitor },
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
];

const shapeOptions: { label: string; value: ShapeVariant; icon: typeof Monitor }[] = [
  { label: "Rounded", value: "rounded", icon: RectangleHorizontal },
  { label: "Pill", value: "pill", icon: Circle },
];

function SidebarSettings() {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();

  return (
    <div className="flex flex-col gap-1.5 py-3">
      <Tooltip content={<span>Press <kbd className="font-mono">T</kbd> to cycle</span>} side="right">
        <div className="flex items-center justify-between px-2">
          <span className="text-[13px] text-muted-foreground">Theme</span>
          <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto h-7 px-2 text-[13px]"
              icon={themeOptions.find((o) => o.value === theme)?.icon}
            />
            <SelectContent>
              {themeOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Tooltip>
      <Tooltip content={<span>Press <kbd className="font-mono">R</kbd> to toggle</span>} side="right">
        <div className="flex items-center justify-between px-2">
          <span className="text-[13px] text-muted-foreground">Radius</span>
          <Select value={shape} onValueChange={(v) => setShape(v as ShapeVariant)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto h-7 px-2 text-[13px]"
              icon={shapeOptions.find((o) => o.value === shape)?.icon}
            />
            <SelectContent>
              {shapeOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Tooltip>
    </div>
  );
}

export default Sidebar;
