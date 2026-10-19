import { eq } from "alfa/database";
import type { HttpContext } from "alfa/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { posts } from "../../src/db";
import { renderPage } from "../../src/render";

export default async (ctx: HttpContext) => {
  const slug = ctx.params.slug;
  const post = slug
    ? await posts.select().where(eq("slug", slug)).first()
    : undefined;

  if (!post) {
    return renderPage(
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">
          404 — post not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          No post matches{" "}
          <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono">
            /{slug}
          </code>
          .
        </p>
        <a href="/" className="mt-6 inline-block">
          <Button variant="outline">Back to the blog</Button>
        </a>
      </main>,
      { title: "Not found", status: 404 },
    );
  }

  return renderPage(
    <main className="mx-auto max-w-3xl px-6 py-12">
      <a href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; all posts
      </a>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{post.title}</h1>
      {post.excerpt ? (
        <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
      ) : null}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">/{post.slug}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </div>
        </CardContent>
      </Card>
    </main>,
    { title: post.title, description: post.excerpt ?? undefined },
  );
};
