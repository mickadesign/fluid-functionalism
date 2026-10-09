"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { showSuccessToast } from "@/lib/docs/settings-toast";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuInput,
  CommandMenuTabs,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuItem,
  useIsMac,
  type CommandMenuItemData,
} from "@/registry/default/command-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/flavored/sidebar";
import { componentList, systemNavList } from "@/lib/docs/components";
import {
  updates,
  updateHref,
  updateKind,
  resolveNavKind,
  latestActiveUpdate,
  STATUS_DOT,
  type UpdateKind,
} from "@/lib/docs/updates";
import { useIcons, type IconName } from "@/lib/icon-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { useShapeContext, type ShapeVariant } from "@/lib/shape-context";
import { useSizeContext, type SizeVariant } from "@/lib/size-context";
import {
  useIconLibrary,
  iconLibraryOrder,
  iconLibraryLabels,
  type IconLibrary,
} from "@/lib/docs/icon-playground";
import { useBase, installUrl, type Base } from "@/lib/base-context";

// ---------------------------------------------------------------------------
// The site's own command menu: ⌘K anywhere. Every page, every setting the
// right panel offers, and a few actions, in one field. The command menu
// component, dogfooded, with its tabs narrowing the 40-odd rows and the
// last pages visited listed first.
// ---------------------------------------------------------------------------

const GITHUB_URL = "https://github.com/mickadesign/fluid-functionalism";
const RECENT_KEY = "ff:command-menu-recent";
const RECENT_MAX = 3;

interface SiteCommandMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SiteCommandMenuContext = createContext<SiteCommandMenuContextValue | null>(null);

export function useSiteCommandMenu(): SiteCommandMenuContextValue {
  const ctx = useContext(SiteCommandMenuContext);
  if (!ctx) throw new Error("useSiteCommandMenu must be used within SiteCommandMenuProvider");
  return ctx;
}

export function SiteCommandMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <SiteCommandMenuContext.Provider value={value}>{children}</SiteCommandMenuContext.Provider>
  );
}

type Kind = "page" | "setting" | "action";

/** A row plus what tab it belongs to. */
interface SiteItem extends CommandMenuItemData {
  kind: Kind;
}

const TABS = [
  { value: "all", label: "All" },
  { value: "page", label: "Pages" },
  { value: "setting", label: "Settings" },
  { value: "action", label: "Actions" },
];

const PAGES: { href: string; label: string; icon: IconName; keywords: string[] }[] = [
  { href: "/", label: "Showcase", icon: "home", keywords: ["home", "bento", "gallery"] },
  { href: "/docs", label: "Introduction", icon: "square-library", keywords: ["docs", "getting started", "install"] },
  { href: "/whats-new", label: "What's New", icon: "rocket", keywords: ["changelog", "updates", "release notes"] },
  { href: "/demo", label: "Demo", icon: "play", keywords: ["slides", "playground"] },
  { href: "/compare", label: "Compare with shadcn", icon: "scaling", keywords: ["shadcn", "side by side"] },
];

const PAGE_ORDER = [
  "/",
  "/docs",
  "/whats-new",
  ...systemNavList.map((s) => `/docs/${s.slug}`),
  ...componentList.map((c) => `/docs/${c.slug}`),
];

const THEMES: { value: Theme; label: string; icon: IconName }[] = [
  { value: "system", label: "Follow system", icon: "monitor" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];
const SHAPES: { value: ShapeVariant; label: string; icon: IconName }[] = [
  { value: "rounded", label: "Rounded", icon: "rectangle-horizontal" },
  { value: "pill", label: "Pill", icon: "circle" },
];
const SIZES: { value: SizeVariant; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
];
const BASES: { value: Base; label: string }[] = [
  { value: "radix", label: "Radix" },
  { value: "base", label: "Base UI" },
];

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Private mode, quota: the suggestions just stay empty.
  }
}

/** The "Search ⌘K" row at the top of the sidebar. */
export function SiteCommandMenuTrigger() {
  const icons = useIcons();
  const mac = useIsMac();
  const { setOpen } = useSiteCommandMenu();
  return (
    <SidebarMenu aria-label="Search">
      <SidebarMenuItem>
        <SidebarMenuButton icon={icons.search} onClick={() => setOpen(true)}>
          Search
        </SidebarMenuButton>
        <SidebarMenuBadge className="font-sans text-site-caption">{mac ? "⌘K" : "Ctrl K"}</SidebarMenuBadge>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function SiteCommandMenu() {
  const { open, setOpen } = useSiteCommandMenu();
  const router = useRouter();
  const pathname = usePathname();
  const icons = useIcons();
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { size, setSize } = useSizeContext();
  const { iconLibrary, setIconLibrary } = useIconLibrary();
  const { base, setBase } = useBase();
  const [tab, setTab] = useState("all");
  const [recent, setRecent] = useState<string[]>([]);

  // Recent pages seed the suggestions; read after mount so the server and
  // the first client render agree.
  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  const remember = useCallback((href: string) => {
    const next = [href, ...readRecent().filter((v) => v !== href)].slice(0, RECENT_MAX);
    writeRecent(next);
    setRecent(next);
  }, []);

  const go = useCallback(
    (href: string) => {
      remember(href);
      router.push(href);
    },
    [remember, router]
  );

  const currentComponent = componentList.find((c) => `/docs/${c.slug}` === pathname);
  const pageIndex = PAGE_ORDER.indexOf(pathname);

  const items = useMemo<SiteItem[]>(() => {
    const current = (on: boolean) => (on ? "Current" : undefined);
    // Latest active changelog kind — dots What's New; expired entries don't count.
    const latest = latestActiveUpdate();
    const latestKind = latest ? updateKind(latest) : undefined;
    const pages: SiteItem[] = [
      ...PAGES.map((p) => ({
        kind: "page" as const,
        value: p.href,
        label: p.label,
        action: `Open ${p.label}`,
        icon: icons[p.icon],
        keywords: p.keywords,
        // Status dots ride in `description` as "New" / "Updated"; renderItem
        // turns those into the same sidebar dots.
        description:
          p.href === "/whats-new" ? latestKind : undefined,
        group: "Pages",
        onSelect: () => go(p.href),
      })),
      ...updates.map((entry) => {
        const href = updateHref(entry);
        const kind = updateKind(entry);
        return {
          kind: "page" as const,
          value: `update:${entry.id}`,
          label: entry.title,
          action: `Open ${entry.title}`,
          description: kind,
          keywords: [
            "update",
            "changelog",
            "whats new",
            kind.toLowerCase(),
            entry.id,
            ...entry.description.split(/\W+/),
            ...entry.title.split(/\W+/),
          ],
          group: "What's New",
          onSelect: () => go(href),
        };
      }),
      ...systemNavList.map((s) => ({
        kind: "page" as const,
        value: `/docs/${s.slug}`,
        label: s.name,
        action: `Open ${s.name}`,
        description: resolveNavKind(s),
        keywords: [s.slug, ...s.description.split(/\W+/)],
        group: "System",
        onSelect: () => go(`/docs/${s.slug}`),
      })),
      ...componentList.map((c) => ({
        kind: "page" as const,
        value: `/docs/${c.slug}`,
        label: c.name,
        action: `Open ${c.name}`,
        description: resolveNavKind(c),
        keywords: [c.slug, ...c.description.split(/\W+/)],
        group: "Components",
        onSelect: () => go(`/docs/${c.slug}`),
      })),
    ];
    const settings: SiteItem[] = [
      ...THEMES.map((t) => ({
        kind: "setting" as const,
        value: `theme:${t.value}`,
        label: `Theme: ${t.label}`,
        action: `Set theme to ${t.label}`,
        description: current(theme === t.value),
        icon: icons[t.icon],
        keywords: ["theme", "appearance", "mode", t.value],
        group: "Settings",
        onSelect: () => {
          setTheme(t.value);
          showSuccessToast(`Theme set to ${t.label}`);
        },
      })),
      ...SHAPES.map((s) => ({
        kind: "setting" as const,
        value: `shape:${s.value}`,
        label: `Radius: ${s.label}`,
        action: `Set radius to ${s.label}`,
        description: current(shape === s.value),
        icon: icons[s.icon],
        keywords: ["radius", "shape", "corners", s.value],
        group: "Settings",
        onSelect: () => {
          setShape(s.value);
          showSuccessToast(`Radius set to ${s.label}`);
        },
      })),
      ...SIZES.map((s) => ({
        kind: "setting" as const,
        value: `size:${s.value}`,
        label: `Size: ${s.label}`,
        action: `Set size to ${s.label}`,
        description: current(size === s.value),
        icon: icons.scaling,
        keywords: ["size", "density", "ladder", s.value],
        group: "Settings",
        onSelect: () => {
          setSize(s.value);
          showSuccessToast(`Size set to ${s.label}`);
        },
      })),
      ...iconLibraryOrder.map((lib: IconLibrary) => ({
        kind: "setting" as const,
        value: `icons:${lib}`,
        label: `Icons: ${iconLibraryLabels[lib]}`,
        action: `Set icons to ${iconLibraryLabels[lib]}`,
        description: current(iconLibrary === lib),
        icon: icons.palette,
        keywords: ["icons", "library", lib],
        group: "Settings",
        onSelect: () => {
          setIconLibrary(lib);
          showSuccessToast(`Icons set to ${iconLibraryLabels[lib]}`);
        },
      })),
      ...BASES.map((b) => ({
        kind: "setting" as const,
        value: `primitive:${b.value}`,
        label: `Primitive: ${b.label}`,
        action: `Set primitive to ${b.label}`,
        description: current(base === b.value),
        icon: icons.settings,
        keywords: ["primitive", "flavor", "radix", "base ui", b.value],
        group: "Settings",
        onSelect: () => {
          setBase(b.value);
          showSuccessToast(`Primitive set to ${b.label}`);
        },
      })),
    ];
    const actions: SiteItem[] = [
      ...(currentComponent
        ? [
            {
              kind: "action" as const,
              value: "action:copy-install",
              label: "Copy install command",
              description: currentComponent.name,
              icon: icons.copy,
              keywords: ["npx", "shadcn", "add", "registry"],
              group: "Actions",
              onSelect: () => {
                const cmd = `npx shadcn@latest add ${installUrl(currentComponent.slug, base)}`;
                // The toast follows the write: no clipboard (an insecure
                // context) or a refused write must not announce a copy.
                navigator.clipboard
                  ?.writeText(cmd)
                  .then(() => showSuccessToast("Install command copied"))
                  .catch(() => {});
              },
            },
          ]
        : []),
      ...(pageIndex > 0
        ? [
            {
              kind: "action" as const,
              value: "action:previous",
              label: "Previous page",
              action: "Go to the previous page",
              icon: icons["arrow-left"],
              shortcut: "left",
              group: "Actions",
              onSelect: () => go(PAGE_ORDER[pageIndex - 1]),
            },
          ]
        : []),
      ...(pageIndex >= 0 && pageIndex < PAGE_ORDER.length - 1
        ? [
            {
              kind: "action" as const,
              value: "action:next",
              label: "Next page",
              action: "Go to the next page",
              icon: icons["arrow-right"],
              shortcut: "right",
              group: "Actions",
              onSelect: () => go(PAGE_ORDER[pageIndex + 1]),
            },
          ]
        : []),
      {
        kind: "action" as const,
        value: "action:github",
        label: "Open on GitHub",
        description: "mickadesign/fluid-functionalism",
        icon: icons.link,
        keywords: ["source", "star", "repository"],
        group: "Actions",
        onSelect: () => window.open(GITHUB_URL, "_blank", "noopener"),
      },
    ];
    return [...pages, ...settings, ...actions];
  }, [
    icons,
    go,
    theme,
    setTheme,
    shape,
    setShape,
    size,
    setSize,
    iconLibrary,
    setIconLibrary,
    base,
    setBase,
    currentComponent,
    pageIndex,
  ]);

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.kind === tab)),
    [items, tab]
  );

  return (
    <CommandMenuDialog
      open={open}
      onOpenChange={setOpen}
      title="Site menu"
      description="Jump to a page or change a setting."
    >
      <CommandMenu items={visible} suggestions={recent} suggestionsLabel="Recent">
        <CommandMenuInput placeholder="Go to a page, change a setting…" />
        <CommandMenuTabs tabs={TABS} value={tab} onValueChange={setTab} />
        <CommandMenuList
          renderItem={(item) => {
            const kind =
              item.description === "New" ||
              item.description === "Updated" ||
              item.description === "Breaking"
                ? (item.description as UpdateKind)
                : undefined;
            return (
              <CommandMenuItem value={item.value}>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1">
                    {item.label}
                  </span>
                  {kind ? (
                    <span
                      className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_DOT[kind]}`}
                      aria-label={kind}
                    />
                  ) : item.description ? (
                    <span className="min-w-0 truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </CommandMenuItem>
            );
          }}
        >
          <CommandMenuEmpty>Nothing matches.</CommandMenuEmpty>
        </CommandMenuList>
        <CommandMenuFooter />
      </CommandMenu>
    </CommandMenuDialog>
  );
}
