import { z } from "zod";

export const postSchema = z.object({
  postTitle: z.string().min(1, "Post title must not be empty"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be a valid format"),
  publishedAt: z.string(),
  modifiedAt: z.string(),
  postContent: z.string().min(1, "Content must not be empty"),
  postExcerpt: z.string().min(1, "Excerpt must not be empty"),
  authorName: z.string(),
  authorId: z.number().int().optional(),
  postStatus: z.string(),
  postLocale: z.string(),
  postImageCover: z.string().url().optional().nullable(),
  estReadTime: z.string().optional().nullable(),
  yoastHead: z.string(),
  tags_names: z.array(z.string()).optional(),
  categories_names: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  images: z.array(z.string()).optional(),
  dominantColor: z.string().nullable(),
});

export const postsSchema = z.array(postSchema);
export type Post = z.infer<typeof postSchema>;
