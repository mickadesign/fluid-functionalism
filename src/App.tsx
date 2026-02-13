import { useState } from "react";
import { SquareLibrary, Clock, Star, Users, Lock } from "lucide-react";
import Dropdown from "./components/Dropdown";
import MenuItem from "./components/MenuItem";
import SubtleTab, { SubtleTabItem } from "./components/SubtleTab";

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

  return (
    <div className="flex flex-col items-center justify-center gap-16 min-h-screen">
      <div className="flex flex-col items-start gap-3">
        <h1
          className="text-[28px] text-neutral-900 leading-none pl-3 mb-2"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          Liquid functionalism
        </h1>
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
  );
}
