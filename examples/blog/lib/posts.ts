export interface Post {
  slug: string;
  title: string;
  body: string;
}

export const posts: Post[] = [
  {
    slug: "hello-alfa",
    title: "Hello alfa",
    body: "alfa routes by file name. This post lives at pages/blog/[slug].ts.",
  },
  {
    slug: "bun-native",
    title: "Bun native",
    body: "Every primitive is Bun: Bun.serve, Bun.FileSystemRouter, Bun.sql.",
  },
  {
    slug: "simplicity",
    title: "Simplicity",
    body: "No build step, no config file, zero runtime dependencies.",
  },
];

export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}
