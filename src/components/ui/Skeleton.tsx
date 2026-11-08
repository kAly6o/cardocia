import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div"> & { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}