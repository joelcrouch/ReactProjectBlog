import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "src/projectPosts");

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
    const processedContent = await remark().use(html).process(content);
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