"use client";

import Link from "next/link";
import StarfieldBackground from "@/components/StarfieldBackground";

interface Post {
  slug: string;
  title: string;
  summary: string;
}

interface PostDisplayProps {
  posts: Post[];
  pageTitle: string;
  basePath: string;
}

export default function PostDisplay({ posts, pageTitle, basePath }: PostDisplayProps) {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <StarfieldBackground />
      <div className="relative z-10 p-8 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6">
              <Link href={`/${basePath}/${post.slug}`}>
                <h2 className="text-2xl font-semibold hover:underline">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{post.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
