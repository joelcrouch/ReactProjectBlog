import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts(); // Not async because it reads from disk only

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug} className="mb-4">
            <Link
              href={`/blog/${post.slug}`}
              className="text-xl text-blue-600 underline"
            >
              {post.title}
            </Link>
            <p className="text-sm text-gray-600">{post.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
