import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ShapeVariant = "pill" | "rounded";

interface ShapeClasses {
  item: string;
  bg: string;
  focusRing: string;
  mergedBg: string;
  container: string;
  button: string;
  input: string;
}

const shapeMap: Record<ShapeVariant, ShapeClasses> = {
  pill: {
    item: "rounded-[20px]",
    bg: "rounded-[20px]",
    focusRing: "rounded-[20px]",
    mergedBg: "rounded-2xl",
    container: "rounded-3xl",
    button: "rounded-[20px]",
    input: "rounded-[20px]",
  },
  rounded: {
    item: "rounded-lg",
    bg: "rounded-lg",
    focusRing: "rounded-[10px]",
    mergedBg: "rounded-lg",
    container: "rounded-xl",
    button: "rounded-lg",
    input: "rounded-lg",
  },
};

interface ShapeContextValue {
  shape: ShapeVariant;
  setShape: (shape: ShapeVariant) => void;
  classes: ShapeClasses;
}

const ShapeContext = createContext<ShapeContextValue | null>(null);

function useShape(): ShapeClasses {
  const ctx = useContext(ShapeContext);
  if (!ctx) return shapeMap.pill;
  return ctx.classes;
}

function useShapeContext() {
  const ctx = useContext(ShapeContext);
  if (!ctx) throw new Error("useShapeContext must be used within a ShapeProvider");
  return ctx;
}

function ShapeProvider({
  children,
  defaultShape = "pill",
}: {
  children: ReactNode;
  defaultShape?: ShapeVariant;
}) {
  const [shape, setShape] = useState<ShapeVariant>(defaultShape);

  return (
    <ShapeContext.Provider value={{ shape, setShape, classes: shapeMap[shape] }}>
      {children}
    </ShapeContext.Provider>
  );
}

export { ShapeProvider, useShape, useShapeContext, shapeMap };
export type { ShapeVariant, ShapeClasses };
