/**
 * SSR helpers: the document shell and the page renderer.
 *
 * alfa routes return a Response; here we render React (shadcn/ui + Tailwind)
 * to HTML and wrap it in the document shell.
 */
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

export interface DocumentProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Document({ title, description, children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

export interface RenderOptions {
  title: string;
  description?: string;
  status?: number;
}

/** Render a React tree into an HTML Response. */
export function renderPage(node: ReactNode, options: RenderOptions): Response {
  const html = renderToString(
    <Document title={options.title} description={options.description}>
      {node}
    </Document>,
  );
  return new Response(html, {
    status: options.status ?? 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
