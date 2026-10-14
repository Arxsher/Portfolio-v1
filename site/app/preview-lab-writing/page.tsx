// Temporary QA page for the lab + writing area (the integration step
// deletes preview-* routes). The repeated rows below reuse the one real
// post only to exercise the list's hover and wrapping; they never ship.
import { Lab, LabGrid } from "@/components/home/lab";
import { Writing } from "@/components/home/writing";
import { WritingList } from "@/components/writing-row";
import { site } from "@/content/site";

const post = site.writing[0];
const qaRows = post
  ? [
      post,
      { ...post, href: `${post.href}#qa-long`, title: `${post.title}, and a much longer title that has to wrap on phones` },
      { title: `${post.title} (internal link)`, date: "2026-03-02", href: "/writing/" },
    ]
  : [];

export default function PreviewLabWriting() {
  return (
    <>
      <Lab />
      <Writing />
      <section className="mt-20">
        <h2 className="text-[13px] text-secondary">qa: several rows</h2>
        <WritingList className="mt-4" posts={qaRows} />
      </section>
      <section className="mt-20">
        <h2 className="text-[13px] text-secondary">qa: empty states</h2>
        <div className="mt-4">
          <LabGrid items={[]} />
        </div>
        <WritingList className="mt-4" posts={[]} />
      </section>
    </>
  );
}
