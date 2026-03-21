import { useParams, Link, Navigate } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogPosts";
import Footer from "../components/Footer";

interface BlogPostPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const BlogPostPage = ({ onOpenAuth }: BlogPostPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  const renderBody = (body: string) => {
    return body.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return <h2 key={i} className="font-display text-2xl font-bold mt-10 mb-4">{block.replace("## ", "")}</h2>;
      }
      if (block.startsWith("### ")) {
        return <h3 key={i} className="font-display text-lg font-bold mt-8 mb-3">{block.replace("### ", "")}</h3>;
      }
      if (block.startsWith("> ")) {
        return (
          <div key={i} className="bg-primary/5 border-l-[3px] border-primary px-5 py-4 rounded-r-md my-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{block.replace("> ", "")}</p>
          </div>
        );
      }
      if (block.startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={i} className="space-y-3 my-4 ml-4">
            {items.map((item, j) => (
              <li key={j} className="text-muted-foreground leading-relaxed text-[15px]" dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
            ))}
          </ul>
        );
      }
      if (block.match(/^\d+\. /)) {
        const items = block.split("\n").filter((l) => l.match(/^\d+\. /));
        return (
          <ol key={i} className="space-y-3 my-4 ml-4 list-decimal list-inside">
            {items.map((item, j) => (
              <li key={j} className="text-muted-foreground leading-relaxed text-[15px]">{item.replace(/^\d+\. /, "")}</li>
            ))}
          </ol>
        );
      }
      return (
        <p key={i} className="text-muted-foreground leading-relaxed text-[15px] mb-4" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
      );
    });
  };

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <div className="max-w-[720px] mx-auto">
            <Link to="/blog" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">
              ← Back to blog
            </Link>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded font-bold uppercase">{post.tag}</span>
              <span className="text-sm text-muted-foreground">{post.date}</span>
              <span className="text-sm text-muted-foreground">{post.readTime}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-10 pb-8 border-b border-border">{post.excerpt}</p>
            <div>{renderBody(post.body)}</div>

            <div className="mt-14 bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
              <h3 className="font-display text-xl font-bold mb-3">Ready to stop chasing invoices?</h3>
              <p className="text-muted-foreground text-sm mb-5">Start your free PayNudge account and get paid faster — no credit card needed.</p>
              <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">
                Get started free →
              </button>
            </div>

            <div className="mt-12">
              <h3 className="font-display text-xl font-bold mb-6">More from the blog</h3>
              <div className="flex flex-col gap-4">
                {related.map((p) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="flex items-center gap-4 p-4 bg-surface border border-border rounded-md hover:border-primary/30 transition-all">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm font-display">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{p.tag} · {p.readTime}</div>
                    </div>
                    <span className="text-primary text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
