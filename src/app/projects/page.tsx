import { getAllPosts } from "@/lib/projectBlogPosts";
import PostDisplay from "@/components/PostDisplay";

export default async function ProjectsPage() {
  const projectPosts = await getAllPosts();

  return (
    <PostDisplay posts={projectPosts} pageTitle="Projects" basePath="projects" />
  );
}
