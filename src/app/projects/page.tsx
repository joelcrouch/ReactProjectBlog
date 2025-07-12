import Link from "next/link";
import { getAllPosts } from "@/lib/projectBlogPosts";

export default async function ProjectsPage() {
  const projectPosts = await getAllPosts();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Projects</h1>
      <ul className="space-y-4">
        {projectPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/projects/${post.slug}`}>
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