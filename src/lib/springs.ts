export const springs = {
  default: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  },
  radio: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  },
  tab: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
} as const;
