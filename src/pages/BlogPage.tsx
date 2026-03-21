import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogPosts";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface BlogPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const BlogPage = ({ onOpenAuth }: BlogPageProps) => (
  <div>
    <div className="bg-surface border-b border-border py-16 text-center pt-24">
      <div className="container-main">
        <h1 className="font-display text-5xl font-bold mb-4">Guides, tips & insights for getting paid faster</h1>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">Practical advice for freelancers and small businesses on invoicing, cash flow, and collections.</p>
      </div>
    </div>
    <section className="section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="bg-surface rounded-lg overflow-hidden border border-border hover:-translate-y-1 hover:border-primary/30 transition-all block">
              <div className="h-[140px] bg-secondary flex items-center justify-center text-5xl border-b border-border">{post.emoji}</div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-[10px] font-mono text-primary">{post.tag}</span>
                  <span className="text-[10px] text-muted-foreground">{post.date}</span>
                  <span className="text-[10px] text-muted-foreground">{post.readTime}</span>
                </div>
                <h3 className="font-display text-[15px] font-bold mb-2 leading-tight">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 text-xs text-primary font-semibold">Read more →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
    <CTASection headline="Stop chasing. Start automating." subtitle="PayNudge handles your payment follow-up automatically." onOpenAuth={onOpenAuth} />
    <Footer />
  </div>
);

export default BlogPage;
