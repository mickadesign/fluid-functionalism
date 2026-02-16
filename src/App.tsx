import { useState, useEffect, useCallback } from "react";
import { SquareLibrary, Clock, Star, Users, Lock, Search, Plus, ArrowRight, Loader } from "lucide-react";
import {
  Dropdown,
  MenuItem,
  SubtleTab,
  SubtleTabItem,
  SubtleTabPanel,
  ThinkingIndicator,
  CheckboxGroup,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  InputGroup,
  InputField,
  Button,
  Switch,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  ShapeProvider,
  useShapeContext,
} from "./components";
import type { ShapeVariant } from "./components";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];

const shapeOptions: { label: string; value: ShapeVariant }[] = [
  { label: "Rounded", value: "rounded" },
  { label: "Pill", value: "pill" },
];

type Theme = "system" | "light" | "dark";
const themeOptions: { label: string; value: Theme }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

function AppContent() {
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set([0]));
  const { shape, setShape } = useShapeContext();
  const selectedShapeIndex = shapeOptions.findIndex((o) => o.value === shape);
  const [theme, setTheme] = useState<Theme>("system");
  const selectedThemeIndex = themeOptions.findIndex((o) => o.value === theme);
  const [searchValue, setSearchValue] = useState("");
  const [switchChecked, setSwitchChecked] = useState(false);

  const transitionSetting = useCallback((callback: () => void) => {
    const root = document.documentElement;
    root.classList.add("transitioning");
    void root.offsetHeight;
    callback();
    setTimeout(() => root.classList.remove("transitioning"), 200);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme !== "system") root.classList.add(theme);
  }, [theme]);

  return (
    <div className="flex flex-col items-start gap-10 sm:gap-16 min-h-screen sm:justify-center mx-auto w-full max-w-[680px] py-10 sm:py-16">
      <div className="flex flex-col items-start gap-3 w-full py-2">
        <h1
          className="text-[22px] sm:text-[28px] text-foreground leading-none pl-3 mx-6"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          Fluid Functionalism
        </h1>
        <p className="text-[13px] text-muted-foreground pl-3 mx-6 mb-4">
          Fluid components used exclusively in service of functional clarity.
        </p>
        <SubtleTab idPrefix="nav" selectedIndex={selectedTab} onSelect={setSelectedTab} aria-label="Navigation">
        {items.map((item, i) => (
          <SubtleTabItem
            key={item.label}
            index={i}
            icon={item.icon}
            label={item.label}
          />
        ))}
        </SubtleTab>
        {items.map((item, i) => (
          <SubtleTabPanel
            key={item.label}
            index={i}
            selectedIndex={selectedTab}
            idPrefix="nav"
          >
            <span className="sr-only">
              {item.label} section
            </span>
          </SubtleTabPanel>
        ))}
      </div>

      <div className="px-6 w-full flex gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted-foreground pl-3">Theme</span>
          <RadioGroup selectedIndex={selectedThemeIndex}>
            {themeOptions.map((option, i) => (
              <RadioItem
                key={option.value}
                index={i}
                label={option.label}
                selected={selectedThemeIndex === i}
                onSelect={() => transitionSetting(() => setTheme(option.value))}
              />
            ))}
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted-foreground pl-3">Radius</span>
          <RadioGroup selectedIndex={selectedShapeIndex}>
            {shapeOptions.map((option, i) => (
              <RadioItem
                key={option.value}
                index={i}
                label={option.label}
                selected={selectedShapeIndex === i}
                onSelect={() => transitionSetting(() => setShape(option.value))}
              />
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="px-6 w-full">
        <InputGroup>
          <InputField
            index={0}
            label="Search"
            placeholder="Search teamspaces..."
            icon={Search}
            value={searchValue}
            onChange={setSearchValue}
          />
        </InputGroup>
      </div>

      <div className="px-6">
        <ThinkingIndicator />
      </div>

      <div className="px-6 w-full">
        <Dropdown checkedIndex={selectedMenuItem ?? undefined}>
          {items.map((item, i) => (
            <MenuItem
              key={item.label}
              index={i}
              icon={item.icon}
              label={item.label}
              checked={selectedMenuItem === i}
              onSelect={() => setSelectedMenuItem(selectedMenuItem === i ? null : i)}
            />
          ))}
        </Dropdown>
      </div>

      <div className="px-6 w-full">
        <CheckboxGroup checkedIndices={checkedItems}>
          {items.map((item, i) => (
            <CheckboxItem
              key={item.label}
              index={i}
              label={item.label}
              checked={checkedItems.has(i)}
              onToggle={() => {
                setCheckedItems((prev) => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                });
              }}
            />
          ))}
        </CheckboxGroup>
      </div>

      <div className="px-6 w-full">
        <Switch
          label="Notifications"
          checked={switchChecked}
          onToggle={() => setSwitchChecked((prev) => !prev)}
        />
      </div>

      <div className="px-6 w-full flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-sm"><Plus /></Button>
          <Button size="icon"><Plus /></Button>
          <Button size="icon-lg"><Plus /></Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button leadingIcon={Plus}>Create</Button>
          <Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
          <Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>Search</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button loading>Loading</Button>
          <Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div className="px-6 w-full flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="tertiary">Open small dialog</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Create teamspace</DialogTitle>
              <DialogDescription>
                Add a new teamspace to organize your projects and collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <p className="text-[13px] text-foreground">
              Choose a name and set permissions for your new teamspace. You can always change these settings later.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost">Open large dialog</Button>
          </DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-[13px] text-muted-foreground pl-3 mx-6">
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
  );
}

export default function App() {
  return (
    <ShapeProvider>
      <AppContent />
    </ShapeProvider>
  );
}
