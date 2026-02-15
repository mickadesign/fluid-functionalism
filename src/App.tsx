import { useState } from "react";
import { SquareLibrary, Clock, Star, Users, Lock, Search } from "lucide-react";
import Dropdown from "./components/Dropdown";
import MenuItem from "./components/MenuItem";
import SubtleTab, { SubtleTabItem } from "./components/SubtleTab";
import ThinkingIndicator from "./components/ThinkingIndicator";
import CheckboxGroup, { CheckboxItem } from "./components/CheckboxGroup";
import RadioGroup, { RadioItem } from "./components/RadioGroup";
import InputGroup, { InputField } from "./components/InputGroup";

const items = [
  { icon: SquareLibrary, label: "Teamspaces" },
  { icon: Clock, label: "Recents" },
  { icon: Star, label: "Favorites" },
  { icon: Users, label: "Shared" },
  { icon: Lock, label: "Private" },
];

export default function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set([0]));
  const [selectedRadio, setSelectedRadio] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="flex flex-col items-start gap-10 sm:gap-16 min-h-screen sm:justify-center mx-auto w-full max-w-[680px] py-10 sm:py-16">
      <div className="flex flex-col items-start gap-3 w-full py-2">
        <h1
          className="text-[22px] sm:text-[28px] text-neutral-900 dark:text-neutral-100 leading-none pl-3 mx-6"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          Fluid Functionalism
        </h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 pl-3 mx-6 mb-4">
          Fluid components used exclusively in service of functional clarity.
        </p>
        <SubtleTab selectedIndex={selectedTab} onSelect={setSelectedTab}>
        {items.map((item, i) => (
          <SubtleTabItem
            key={item.label}
            index={i}
            icon={item.icon}
            label={item.label}
          />
        ))}
        </SubtleTab>
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
        <RadioGroup selectedIndex={selectedRadio}>
          {items.map((item, i) => (
            <RadioItem
              key={item.label}
              index={i}
              label={item.label}
              selected={selectedRadio === i}
              onSelect={() => setSelectedRadio(i)}
            />
          ))}
        </RadioGroup>
      </div>

      <p className="text-[13px] text-neutral-400 dark:text-neutral-500 pl-3 mx-6">
        Designed by{" "}
        <a
          href="https://x.com/micka_design"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-150"
        >
          @micka_design
        </a>
      </p>
    </div>
  );
}
