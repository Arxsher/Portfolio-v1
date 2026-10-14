"use client";

// "Sign the guestbook": the ink pill that opens the sign form in the Index
// sheet. It carries data-sign, so a blank page next to it (inside a
// `group/sign` wrapper) traces its ghost name while the button is hovered
// or focused.

import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";

export function SignButton({
  size = "lg",
  label = "Sign the guestbook",
  className,
}: {
  size?: "md" | "lg";
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-sign=""
      onClick={() => openCommand("guestbook")}
      className={cn("btn btn-solid", size === "lg" && "btn-lg", className)}
    >
      <Star size={13} className="text-terra-fill" />
      {label}
    </button>
  );
}
