// Ashh's picture for the profile row and the social panels. It fills
// its parent (which sets the size, shape and tile colour). Until
// site.avatar points at a photo, the "arsher" mark stands in, centred on
// the tile.

import { Logo } from "@/components/logo";
import { site } from "@/content/site";

export function AvatarFill({ mark = 24, eager = false }: { mark?: number; eager?: boolean }) {
  const src: string = site.avatar ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${site.avatar}` : "";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={64}
        height={64}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        className="size-full object-cover"
      />
    );
  }
  return (
    <span aria-hidden="true" className="flex size-full items-center justify-center text-primary">
      <Logo size={mark} />
    </span>
  );
}
