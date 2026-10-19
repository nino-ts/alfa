import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { posts } from "../src/db";
import { renderPage } from "../src/render";

export default async () => {
  // Booleans come back as 0/1 on SQLite, so filter in JS (dialect-agnostic).
  const all = await posts.select().get();
  const published = all.filter((post) => post.published);

  return renderPage(
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">alfa blog</h1>
        <p className="text-muted-foreground">
          Server-rendered with React + shadcn/ui + Tailwind, routed by alfa.
        </p>
      </header>

      <section className="grid gap-4">
        {published.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No posts yet — create the first one below.
          </div>
        ) : (
          published.map((post) => (
            <a key={post.id} href={`/posts/${post.slug}`} className="block">
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  {post.excerpt ? (
                    <CardDescription>{post.excerpt}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    /posts/{post.slug}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))
        )}
      </section>

      <section className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>New post</CardTitle>
            <CardDescription>
              Posts to{" "}
              <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono">
                /api/posts
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action="/api/posts" className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Hello world"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="hello-world"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  name="excerpt"
                  placeholder="Optional summary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={6}
                  placeholder="Write something…"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  value="on"
                  className="size-4 accent-primary"
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>,
    {
      title: "alfa blog",
      description: "A blog built with alfa, React, shadcn/ui and Tailwind.",
    },
  );
};
