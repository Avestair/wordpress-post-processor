// src/posts/post.converter.ts
import { Post } from "./post.schema";
import { stripHtml } from "string-strip-html";

export function convertToMarkdown(post: Post): string {
  const {
    postTitle,
    slug,
    publishedAt,
    modifiedAt,
    postContent,
    postExcerpt,
    authorName,
    authorId,
    postStatus,
    postLocale,
    postImageCover,
    estReadTime,
    yoastHead,
    tags_names,
    categories_names,
    images,
    dominantColor,
  } = post;

  // Build the YAML frontmatter string with all fields.
  const frontmatter = `---
title: "${postTitle.replace(/"/g, '\\"')}"
slug: "${slug}"
published_at: "${new Date(publishedAt).toISOString()}"
modified_at: "${new Date(modifiedAt).toISOString()}"
status: "${postStatus}"
locale: "${postLocale}"
author_id: ${authorId}
dominantColor: "${dominantColor}"
author_name: "${authorName.replace(/"/g, '\\"')}"
cover_image: "${postImageCover || ""}"
tags: [${(tags_names || []).map((tag) => `"${tag}"`).join(", ")}]
categories: [${(categories_names || []).map((cat) => `"${cat}"`).join(", ")}]
reading_time: "${estReadTime}"
images: [${(images || []).map((img) => `"${img}"`).join(", ")}]
yoast_head: "${yoastHead.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
---
`;

  // --- HTML to Markdown Conversion Logic ---
  let markdownBody = postContent;

  // Handle headings (h1, h2, h3, etc.)
  markdownBody = markdownBody.replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1\n\n");
  markdownBody = markdownBody.replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1\n\n");

  // Handle lists (both ordered and unordered)
  markdownBody = markdownBody.replace(/<ul[^>]*>(.*?)<\/ul>/gs, (ulMatch) => {
    return (
      stripHtml(ulMatch)
        .result.trim()
        .split("\n")
        .map((item) => `- ${item.trim()}`)
        .join("\n") + "\n\n"
    );
  });
  markdownBody = markdownBody.replace(/<ol[^>]*>(.*?)<\/ol>/gs, (olMatch) => {
    return (
      stripHtml(olMatch)
        .result.trim()
        .split("\n")
        .map((item, index) => `${index + 1}. ${item.trim()}`)
        .join("\n") + "\n\n"
    );
  });

  // Handle tables (a more robust approach)
  markdownBody = markdownBody.replace(
    /<table[^>]*>.*?<\/table>/gs,
    (tableMatch) => {
      const rows = tableMatch.match(/<tr[^>]*>.*?<\/tr>/gs);
      if (!rows) return "";

      const mdRows = rows.map((row, rowIndex) => {
        const cells = row.match(/<t[dh][^>]*>.*?<\/t[dh]>/gs);
        if (!cells) return "";
        const content = cells
          .map((cell) => stripHtml(cell).result.trim())
          .join(" | ");
        return `| ${content} |`;
      });

      const header = mdRows[0];
      const separator = `|${"---|".repeat(header.split("|").length - 2)}`;
      const body = mdRows.slice(1).join("\n");

      return `\n${header}\n${separator}\n${body}\n`;
    }
  );

  // Handle paragraphs and line breaks
  markdownBody = markdownBody.replace(/<p[^>]*>(.*?)<\/p>/g, "$1\n\n");
  markdownBody = markdownBody.replace(/<br[^>]*>/g, "\n");

  // Remove figure blocks with images, replacing them with a Markdown image link
  markdownBody = markdownBody.replace(
    /<figure[^>]*>.*?<img[^>]*src="([^">]+)"[^>]*>.*?<\/figure>/gs,
    (match, src) => {
      return `![Post Image](${src})\n\n`;
    }
  );

  // Strip any remaining HTML tags
  markdownBody = stripHtml(markdownBody).result;

  // Combine frontmatter and markdown body
  return frontmatter + "\n" + markdownBody.trim();
}
