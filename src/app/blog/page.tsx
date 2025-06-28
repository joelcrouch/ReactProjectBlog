// // src/app/blog/page.tsx
// export default function BlogPage() {
//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-4">Blog</h1>
//       <p className="text-lg text-gray-700">
//         Welcome to the blog. Soon, you will find posts about my thoughts,
//         how-tos, and experiences.
//       </p>
//     </div>
//   );
// }

// src/app/blog/page.tsx
// import Link from "next/link";
// import { blogPosts } from "@/lib/blogPosts";

// export default function BlogPage() {
//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-4">Blog</h1>
//       <ul className="space-y-4">
//         {blogPosts.map((post) => (
//           <li key={post.slug}>
//             <Link href={`/blog/${post.slug}`}>
//               <h2 className="text-2xl font-semibold hover:underline">
//                 {post.title}
//               </h2>
//               <p className="text-gray-600">{post.summary}</p>
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

import Link from "next/link";
import { getAllPosts } from "@/lib/blogPosts";

export default async function BlogPage() {
  const blogPosts = await getAllPosts();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <ul className="space-y-4">
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold hover:underline">
                {post.title}
              </h2>
              <p className="text-gray-600">{post.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
