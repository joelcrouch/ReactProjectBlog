// src/app/blog/[slug]/page.tsx
import { blogPosts } from "@/lib/blogPosts";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export default function PostPage({ params }: Props) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-500 mb-4">{post.date}</p>
      <div className="prose">{post.content}</div>
    </div>
  );
}
