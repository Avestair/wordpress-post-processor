import { writeFile, mkdir } from "fs/promises";
import { convertToMarkdown } from "./post.converter";
import { calculateReadingTime } from "../utils/utils";
import path from "path";
import ColorThief from "colorthief";

const POSTS_DIRECTORY = path.join(process.cwd(), "processed_posts");
const API_URL = `${process.env.WORDPRESS_SITE_URL}/wp-json/wp/v2`;

// --- Utility Functions for fetching taxonomy names ---
async function fetchAllTerms(endpoint: string): Promise<Map<number, string>> {
  const url = `${API_URL}/${endpoint}?per_page=100`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch terms from ${endpoint}: ${response.statusText}`
    );
  }
  const terms = await response.json();
  return new Map(
    terms.map((term: { id: number; name: string }) => [term.id, term.name])
  );
}

async function getColorThiefDominantColor(
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    // Get a palette of 10 colors (you can adjust this number)
    const palette = await ColorThief.getPalette(imageBuffer, 10);

    if (palette && palette.length > 0) {
      let mostSaturatedColor = palette[0];
      let maxSaturation = 0;

      for (const rgb of palette) {
        // Convert RGB to HSL to check for saturation
        const r = rgb[0] / 255;
        const g = rgb[1] / 255;
        const b = rgb[2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const saturation = max === 0 ? 0 : delta / max;

        if (saturation > maxSaturation) {
          maxSaturation = saturation;
          mostSaturatedColor = rgb;
        }
      }

      // Convert the most saturated color back to a hex string
      const toHex = (c: number) => c.toString(16).padStart(2, "0");
      return `#${toHex(mostSaturatedColor[0])}${toHex(
        mostSaturatedColor[1]
      )}${toHex(mostSaturatedColor[2])}`;
    }
  } catch (error) {
    console.error("Failed to extract vibrant color with ColorThief:", error);
  }
  return null;
}

// --- Main processing function ---
export async function processPosts(): Promise<void> {
  console.log("Starting post processing...");

  try {
    await mkdir(POSTS_DIRECTORY, { recursive: true });

    // 1. Fetch all posts with the '_embed' parameter
    const postsResponse = await fetch(`${API_URL}/posts?_embed&per_page=100`);
    if (!postsResponse.ok) {
      throw new Error(`Failed to fetch posts: ${postsResponse.statusText}`);
    }
    const allRes = await postsResponse.json();

    // 2. Check if the response is an array. If not, wrap it in one.
    const rawPosts = Array.isArray(allRes) ? allRes : [allRes];

    // 3. Fetch all categories and tags once to create lookup maps
    console.log("Fetching categories and tags...");
    const categoryMap = await fetchAllTerms("categories");
    const tagMap = await fetchAllTerms("tags");
    console.log("Categories and tags fetched successfully.");

    // 4. Process each post, transforming the data
    for (const rawPost of rawPosts) {
      // --- Extract ALL the data points you listed ---
      const postTitle = rawPost.title.rendered;
      const slug = rawPost.slug;
      const publishedAt = rawPost.date;
      const modifiedAt = rawPost.modified;
      const postContent = rawPost.content.rendered;
      const postExcerpt = rawPost.excerpt.rendered;

      // Accessing yoast_head_json safely
      const yoastData = rawPost.yoast_head_json;

      const authorName = yoastData?.author || "Unknown Author";
      const authorId = rawPost.author;
      const postStatus = rawPost.status;
      const postLocale = yoastData?.og_locale || "en_US";

      // Using optional chaining and a fallback for the image URL
      const postImageCover =
        yoastData?.og_image?.[0]?.url ||
        rawPost._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        null;

      // Using bracket notation for the key with spaces
      const estReadTime =
        yoastData?.twitter_misc?.["Est. reading time"] || "N/A";
      const yoastHead = rawPost.yoast_head; // This is the full Yoast HTML string

      // --- Continue with the rest of the processing logic ---
      // Get category and tag names
      const categoryIds = rawPost.categories || [];
      const tagIds = rawPost.tags || [];
      const categoryNames = categoryIds
        .map((id: number) => categoryMap.get(id))
        .filter(Boolean) as string[];
      const tagNames = tagIds
        .map((id: number) => tagMap.get(id))
        .filter(Boolean) as string[];

      // Calculate reading time based on content
      const readingTime = calculateReadingTime(postContent);

      // Find all images in the post content
      const imageSources: string[] = [];
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      while ((match = imgRegex.exec(postContent)) !== null) {
        imageSources.push(match[1]);
      }

      // Add the cover image to the list of images
      if (postImageCover) {
        imageSources.unshift(postImageCover);
      }

      let dominantColor = null;
      if (postImageCover) {
        try {
          if (postImageCover) {
            const imageResponse = await fetch(postImageCover);
            const imageBuffer = await imageResponse.arrayBuffer();
            dominantColor = await getColorThiefDominantColor(
              Buffer.from(imageBuffer)
            );
          }
        } catch (error) {
          console.error(
            `Failed to process image from ${postImageCover}`,
            error
          );
        }
      }

      // Create a new object with all the required data
      const processedPost = {
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
        tags_names: tagNames,
        categories_names: categoryNames,
        readingTime,
        images: imageSources,
        dominantColor,
      };

      const markdownContent = convertToMarkdown(processedPost);

      const filename = path.join(POSTS_DIRECTORY, `${slug}.md`);
      await writeFile(filename, markdownContent, "utf8");
      console.log(`✅ Successfully created file: ${filename}`);
    }

    console.log("Post processing completed.");
  } catch (error) {
    console.error("❌ An error occurred during post processing:", error);
  }
}
