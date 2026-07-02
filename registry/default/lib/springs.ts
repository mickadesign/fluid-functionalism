// Motion tokens. Each tier's value is the ENTER transition — a spring, with a
// little bounce on the larger tiers. Its `.exit` is the matching EXIT transition
// — a plain tween, no bounce, one tier quicker — so a dismissal reads as crisp
// and final rather than replaying the entrance in reverse.
//
//   transition={spring.fast}                              // enter
//   exit={{ opacity: 0, transition: spring.fast.exit }}   // leave
//
// The bigger the thing that moves, the slower the spring. Never hand-write a
// duration — always reach for a tier.
export const spring = {
  fast: {
    type: "spring" as const,
    duration: 0.08,
    bounce: 0,
    exit: { duration: 0.06 },
  },
  moderate: {
    type: "spring" as const,
    duration: 0.16,
    bounce: 0.08,
    exit: { duration: 0.12 },
  },
  // Critically damped moderate: same perceived speed, no overshoot; for
  // panels/sheets that must land exactly (drawers, merged selection
  // backgrounds).
  settle: {
    type: "spring" as const,
    duration: 0.16,
    bounce: 0,
    exit: { duration: 0.12 },
  },
  slow: {
    type: "spring" as const,
    duration: 0.24,
    bounce: 0.12,
    exit: { duration: 0.16 },
  },
} as const;
