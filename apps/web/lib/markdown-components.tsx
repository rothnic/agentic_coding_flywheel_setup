"use client";

import { ComponentPropsWithoutRef, ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { useState, useCallback } from "react";

/**
 * ReactMarkdown passes AST-related props (node, siblingCount, index, etc.) to custom components.
 * These must NOT be spread to DOM elements or they create invalid HTML like <h2 node="[object Object]">
 * which breaks Tailwind's prose CSS selectors.
 *
 * This file provides sanitized component overrides for ReactMarkdown.
 */

// Props that ReactMarkdown passes which should NOT go to DOM elements
const REACT_MARKDOWN_INTERNAL_PROPS = [
  "node",
  "siblingCount",
  "index",
  "ordered",
  "isHeader",
  "inline",
] as const;

/**
 * Strips ReactMarkdown internal props from an object, returning only DOM-safe props
 */
function sanitizeProps<T extends Record<string, unknown>>(props: T): Omit<T, typeof REACT_MARKDOWN_INTERNAL_PROPS[number]> {
  const sanitized = { ...props };
  for (const key of REACT_MARKDOWN_INTERNAL_PROPS) {
    delete sanitized[key];
  }
  return sanitized;
}

/**
 * Creates a component factory that automatically strips ReactMarkdown internal props
 * and optionally demotes heading levels (h1 -> h2, h2 -> h3, etc.)
 */
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  children?: ReactNode;
  className?: string;
  id?: string;
  [key: string]: unknown;
}

function createHeading(Tag: HeadingTag) {
  return function Heading({ children, ...props }: HeadingProps) {
    const safeProps = sanitizeProps(props);
    return <Tag {...safeProps}>{children}</Tag>;
  };
}

// Demoted headings (h1 in markdown renders as h2 in DOM, etc.)
// This is because the page already has an h1 (lesson title)
const DemotedH1 = createHeading("h2");
const DemotedH2 = createHeading("h3");
const DemotedH3 = createHeading("h4");
const DemotedH4 = createHeading("h5");
const DemotedH5 = createHeading("h6");
const DemotedH6 = createHeading("h6");

// Paragraph component
function Paragraph({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <p {...safeProps}>{children}</p>;
}

// Anchor component with external link handling
function Anchor({ children, href, ...props }: { children?: ReactNode; href?: string; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  const isExternal = href?.startsWith("http");

  return (
    <a
      href={href}
      {...safeProps}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

// List components
function UnorderedList({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <ul {...safeProps}>{children}</ul>;
}

function OrderedList({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <ol {...safeProps}>{children}</ol>;
}

function ListItem({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <li {...safeProps}>{children}</li>;
}

// Blockquote component
function Blockquote({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <blockquote {...safeProps}>{children}</blockquote>;
}

// Premium code block with copy button
function CodeBlock({ children, className, ...props }: { children?: ReactNode; className?: string; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const code = typeof children === "string" ? children : "";
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [children]);

  // Detect language from className (e.g., "language-bash")
  const language = className?.replace("language-", "") || "";

  return (
    <div className="group relative">
      {/* Language badge & copy button */}
      <div className="absolute right-3 top-3 flex items-center gap-2 z-10">
        {language && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[oklch(0.72_0.19_145)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <pre className={className} {...safeProps}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// Inline code component
function InlineCode({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  // Check if this is inside a pre (block code) - if so, just render children
  // The pre will handle the code styling
  return <code {...safeProps}>{children}</code>;
}

// Pre component - wrapper for code blocks
function Pre({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return (
    <div className="group relative my-6">
      <pre
        {...safeProps}
        className="rounded-xl border border-border/50 bg-muted/50 p-4 overflow-x-auto"
      >
        {children}
      </pre>
    </div>
  );
}

// Strong/bold component
function Strong({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <strong {...safeProps}>{children}</strong>;
}

// Emphasis/italic component
function Em({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <em {...safeProps}>{children}</em>;
}

// Horizontal rule
function Hr(props: { [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <hr {...safeProps} className="my-8 border-border/50" />;
}

// Table components
function Table({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return (
    <div className="my-6 overflow-x-auto">
      <table {...safeProps} className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

function TableHead({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <thead {...safeProps} className="bg-muted/50">{children}</thead>;
}

function TableBody({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <tbody {...safeProps}>{children}</tbody>;
}

function TableRow({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <tr {...safeProps} className="border-b border-border/50">{children}</tr>;
}

function TableCell({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <td {...safeProps} className="px-4 py-3 text-sm">{children}</td>;
}

function TableHeader({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const safeProps = sanitizeProps(props);
  return <th {...safeProps} className="px-4 py-3 text-left text-sm font-semibold">{children}</th>;
}

/**
 * Complete set of sanitized ReactMarkdown components
 * Use this with ReactMarkdown's `components` prop
 */
export const markdownComponents = {
  // Headings are demoted by 1 level (h1->h2, etc.) since page has its own h1
  h1: DemotedH1,
  h2: DemotedH2,
  h3: DemotedH3,
  h4: DemotedH4,
  h5: DemotedH5,
  h6: DemotedH6,

  // Text elements
  p: Paragraph,
  a: Anchor,
  strong: Strong,
  em: Em,

  // Lists
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,

  // Code
  code: InlineCode,
  pre: Pre,

  // Other
  blockquote: Blockquote,
  hr: Hr,

  // Tables
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  tr: TableRow,
  td: TableCell,
  th: TableHeader,
};
