import { getAllPosts } from "@/lib/blogPosts";
import PostDisplay from "@/components/PostDisplay";

export default async function BlogPage() {
  const blogPosts = await getAllPosts();

  return (
    <PostDisplay posts={blogPosts} pageTitle="Blog" basePath="blog" />
  );
}