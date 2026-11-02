// shadcn/ui's Skeleton, unchanged (https://ui.shadcn.com/docs/components/skeleton).
// The reveal item installs it from the default shadcn registry; the site keeps
// this copy at the same installed path so the docs demos import it the same way.
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
