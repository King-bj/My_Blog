import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import { rehype } from 'rehype';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { Post, PostMeta, PostFrontmatter } from '@/types';
import { calculateReadingTime, generateExcerpt } from './utils';
import {
  getCached,
  getCachedAsync,
  getCachedByMtime,
  getDirectoryLatestMtime,
} from './content-cache';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''));
}

function readPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const frontmatter = data as PostFrontmatter;
    
    if (frontmatter.published === false) {
      return null;
    }

    const readingTime = calculateReadingTime(content);
    const excerpt = frontmatter.description || generateExcerpt(content);

    return {
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      description: frontmatter.description,
      content,
      tags: frontmatter.tags || [],
      cover: frontmatter.cover,
      excerpt,
      readingTime,
      published: frontmatter.published ?? true,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  return getCached(`post:${slug}`, fullPath, () => readPostBySlug(slug));
}

export function getAllPosts(): PostMeta[] {
  return getCachedByMtime(
    'posts-index',
    getDirectoryLatestMtime(postsDirectory),
    () => {
      const slugs = getAllPostSlugs();
      const posts = slugs
        .map(slug => {
          const post = getPostBySlug(slug);
          if (!post) return null;

          const { content, ...meta } = post;
          return meta;
        })
        .filter((post): post is PostMeta => post !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return posts;
    }
  );
}

export function getPostsByTag(tag: string): PostMeta[] {
  const allPosts = getAllPosts();
  return allPosts.filter(post => 
    post.tags.some(postTag => 
      postTag.toLowerCase() === tag.toLowerCase()
    )
  );
}

export function getAllTags(): { tag: string; count: number }[] {
  const allPosts = getAllPosts();
  const tagCounts: Record<string, number> = {};

  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPaginatedPosts(page: number = 1, limit: number = 6) {
  const allPosts = getAllPosts();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const posts = allPosts.slice(startIndex, endIndex);
  
  return {
    posts,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

function extractMermaidBlocks(markdown: string): {
  markdown: string;
  blocks: string[];
} {
  const blocks: string[] = [];
  const processedMarkdown = markdown.replace(
    /```mermaid\s*\n([\s\S]*?)```/gi,
    (_, code: string) => {
      const index = blocks.length;
      blocks.push(code.trim());
      return `\n\n<div class="mermaid-placeholder" data-index="${index}"></div>\n\n`;
    }
  );

  return { markdown: processedMarkdown, blocks };
}

function restoreMermaidBlocks(html: string, blocks: string[]): string {
  if (blocks.length === 0) {
    return html;
  }

  return html.replace(
    /<div class="mermaid-placeholder" data-index="(\d+)"><\/div>/g,
    (_, index: string) => `<div class="mermaid">${blocks[Number(index)]}</div>`
  );
}

async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const { markdown: markdownWithoutMermaid, blocks } = extractMermaidBlocks(markdown);

  const remarkResult = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdownWithoutMermaid);
    
  const rehypeResult = await rehype()
    .use(rehypeSlug)
    .use(rehypePrismPlus, {
      showLineNumbers: true,
      ignoreMissing: true,
      lineNumbersStyle: true
    })
    .use(rehypeStringify)
    .process(remarkResult.toString());
    
  return restoreMermaidBlocks(rehypeResult.toString(), blocks);
}

export async function markdownToHtml(
  markdown: string,
  options?: { slug?: string; statPath?: string }
): Promise<string> {
  if (options?.slug && options?.statPath) {
    return getCachedAsync(
      `html:${options.slug}`,
      options.statPath,
      () => renderMarkdownToHtml(markdown)
    );
  }

  return renderMarkdownToHtml(markdown);
}
