// src/lib/blogPosts.ts
// export const blogPosts = [
//   {
//     slug: "my-first-post",
//     title: "My First Post",
//     summary: "A quick intro to my blog",
//     date: "2025-05-19",
//     content: `Welcome to my first post!`,
//   },
//   {
//     slug: "another-idea",
//     title: "Another Idea",
//     summary: "Thinking out loud",
//     date: "2025-05-17",
//     content: `This is another blog post.`,
//   },
// ];

// import fs from "fs";
// import path from "path";
// import matter from "gray-matter";
// import { remark } from "remark";
// import html from "remark-html";

// const postsDirectory = path.join(process.cwd(), "src/posts");

// export type Post = {
//   slug: string;
//   title: string;
//   date: string;
//   summary: string;
//   content: string;
// };

// export async function getPostBySlug(slug: string): Promise<Post> {
//   const fullPath = path.join(postsDirectory, `${slug}.md`);
//   const fileContents = fs.readFileSync(fullPath, "utf8");

//   const { data, content } = matter(fileContents);
//   const processedContent = await remark().use(html).process(content);
//   const contentHtml = processedContent.toString();

//   return {
//     slug,
//     title: data.title,
//     date: data.date,
//     summary: data.summary,
//     content: contentHtml,
//   };
// }

// export function getAllPostSlugs(): string[] {
//   return fs.readdirSync(postsDirectory).map((fileName) => fileName.replace(/\.md$/, ""));
// }

// export async function getAllPosts() {
//   const fileNames = fs.readdirSync(postsDirectory);

//   const posts = await Promise.all(
//     fileNames.map(async (fileName) => {
//       const slug = fileName.replace(/\.md$/, '');
//       const fullPath = path.join(postsDirectory, fileName);
//       const fileContents = fs.readFileSync(fullPath, 'utf8');
//       const { data, content } = matter(fileContents);
//       return {
//         slug,
//         title: data.title,
//         date: data.date,
//         summary: data.summary,
//         // Optionally omit full content for index
//         content: "", // or: contentHtml if you really want
//       };
//     })
//   );

//   posts.sort((a, b) => (a.date < b.date ? 1 : -1));
//   return posts;
// }

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-ini";

const postsDirectory = path.join(process.cwd(), "src/posts");

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
};

// Reads and parses a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const processedContent = await remark()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, { behavior: "wrap" })
      .use(rehypePrismPlus)
      .use(rehypeStringify)
      .process(content);
    const contentHtml = processedContent.toString();

    return {
      slug,
      title: data.title,
      date: data.date,
      summary: data.summary,
      content: contentHtml,
    };
  } catch (err) {
    console.error("Failed to load post:", err);
    return null;
  }
}

// Gets all post slugs (used for static generation)
export async function getAllPostSlugs(): Promise<string[]> {
  const files = await fs.promises.readdir(postsDirectory);
  return files.map((fileName) => fileName.replace(/\.md$/, ""));
}

// Gets all posts (for listing on blog index)
export async function getAllPosts(): Promise<Omit<Post, "content">[]> {
  const fileNames = await fs.promises.readdir(postsDirectory);

  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = await fs.promises.readFile(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        summary: data.summary,
      };
    })
  );

  // Sort by newest first
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}
