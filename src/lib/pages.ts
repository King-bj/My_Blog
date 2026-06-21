import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { markdownToHtml } from './posts';
import { getCachedAsync } from './content-cache';

const pagesDirectory = path.join(process.cwd(), 'content/pages');

export interface PageContent {
  content: string;
  htmlContent: string;
}

export async function getPageContent(pageName: string): Promise<PageContent | null> {
  const fullPath = path.join(pagesDirectory, `${pageName}.md`);

  try {
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return getCachedAsync(`page:${pageName}`, fullPath, async () => {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { content } = matter(fileContents);

      const htmlContent = await markdownToHtml(content, {
        slug: `page:${pageName}`,
        statPath: fullPath,
      });

      return {
        content,
        htmlContent,
      };
    });
  } catch (error) {
    console.error(`Error reading page ${pageName}:`, error);
    return null;
  }
}
