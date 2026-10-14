// Zakaria's picture for the panels that show who you are writing to. It
// fills its parent (which sets the size and shape). Until site.avatar
// points at a photo, the star mark stands in, in cobalt on a band-coloured
// tile. (The home page has no avatar block: the name is the hero.)

import { Logo } from "@/components/logo";
import { site } from "@/content/site";

export function AvatarFill({ mark = 24, eager = false }: { mark?: number; eager?: boolean }) {
  const src: string = site.avatar;
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
    <span aria-hidden="true" className="flex size-full items-center justify-center bg-band text-cobalt">
      <Logo size={mark} />
    </span>
  );
}
