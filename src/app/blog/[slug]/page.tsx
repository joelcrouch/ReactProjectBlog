// src/app/blog/[slug]/page.tsx
// import { blogPosts } from "@/lib/blogPosts";
// import { notFound } from "next/navigation";

// type Props = {
//   params: { slug: string };
// };

// export default function PostPage({ params }: Props) {
//   const post = blogPosts.find((p) => p.slug === params.slug);
//   if (!post) return notFound();

//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
//       <p className="text-gray-500 mb-4">{post.date}</p>
//       <div className="prose">{post.content}</div>
//     </div>
//   );
// }

// import { notFound } from "next/navigation";
// import { getPostBySlug, getAllPostSlugs, Post } from "@/lib/blogPosts";

// type Props = {
//   params: { slug: string };
// };

// export async function generateStaticParams() {
//   const slugs = getAllPostSlugs();
//   return slugs.map((slug) => ({ slug }));
// }

// export default async function PostPage({ params }: Props) {
//   const post: Post = await getPostBySlug(params.slug);
//   if (!post) return notFound();

//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
//       <p className="text-gray-500 mb-4">{post.date}</p>
//       <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }}></div>
//     </div>
//   );
// }


import { notFound } from "next/navigation";
import { getPostBySlug, getAllPostSlugs, Post } from "@/lib/blogPosts";

type Props = {
  params: { slug: string };
};

export const dynamicParams = true;

// Generates static paths for all posts at build time
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Renders a specific blog post
export default async function PostPage({ params }: Props) {
  const awaitedParams = await params;
  const post = await getPostBySlug(awaitedParams.slug);
  if (!post) return notFound();

  // const post: Post | null = await getPostBySlug(params.slug);
  // if (!post) return notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-500 mb-4">
        {new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}

