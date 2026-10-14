// Temporary QA page for the hero (the integration step deletes preview-* routes).
// Shows the top of the home page on its own, the same way app/page.tsx composes it.
import { HeroPond } from "@/components/home/hero-pond";
import { Intro } from "@/components/home/intro";
import { Profile } from "@/components/home/profile";

export default function PreviewHero() {
  return (
    <>
      <HeroPond />
      <Profile />
      <Intro />
      <div aria-hidden="true" className="h-[60vh]" />
    </>
  );
}
