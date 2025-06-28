// import { notFound } from "next/navigation";
// import { getPostBySlug, getAllPostSlugs } from "@/lib/blogPosts";
// //import { Metadata } from "next";

// // If you're using metadata generation (optional)
// // export async function generateStaticParams(): Promise<{ slug: string }[]> {
// //   const slugs = await getAllPostSlugs();
// //   return slugs.map((slug) => ({ slug }));
// // }

// export async function generateStaticParams() {
//   const slugs = await getAllPostSlugs();
//   return slugs.map(slug => ({ slug }));
// }

// // This is the correct type to match Next.js expectations
// // type PageProps = {
// //   params: {
// //     slug: string;
// //   };
// // };

// export default async function PostPage({ params }: { params: { slug: string } }) {
//   params = await props.params;
//   const post = await getPostBySlug(params.slug);
//   if (!post) return notFound();;

// // export default async function PostPage({ params }: PageProps) {
// //   const post = await getPostBySlug(params.slug);
// //   if (!post) return notFound();

//   return (
//     <div className="p-8 max-w-3xl mx-auto">
//       <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
//       <p className="text-gray-500 mb-4">
//         {new Date(post.date).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         })}
//       </p>
//       <div
//         className="prose"
//         dangerouslySetInnerHTML={{ __html: post.content }}
//       />
//     </div>
//   );
// }


import { notFound } from "next/navigation";
import { getPostBySlug, getAllPostSlugs } from "@/lib/blogPosts";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PostPage(props: Props) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

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
      <article
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}
