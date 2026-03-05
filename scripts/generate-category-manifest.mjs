#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function usage() {
  console.log('Usage: node scripts/generate-category-manifest.mjs <category-relative-path> [output-file-name]');
  console.log('Example: node scripts/generate-category-manifest.mjs articles/chronological-debates category-manifest.json');
}

function extractWithRegex(source, regex) {
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

function parseCsvTags(value) {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

async function parseArticle(articleDirRelPath) {
  const articleIndexPath = path.join(rootDir, articleDirRelPath, 'index.html');
  const html = await fs.readFile(articleIndexPath, 'utf8');

  const titleJa = extractWithRegex(
    html,
    /<h1[^>]*data-i18n=["']title["'][^>]*>([\s\S]*?)<\/h1>/i
  ).replace(/<[^>]*>/g, '').trim();

  const titleEn = extractWithRegex(
    html,
    /en\s*:\s*\{[\s\S]*?\btitle\s*:\s*"([^"]+)"/i
  );

  const tagsJaRaw = extractWithRegex(
    html,
    /<meta\s+name=["']tags["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i
  );

  const tagsEnRaw = extractWithRegex(
    html,
    /<meta\s+name=["']tags["'][^>]*\bdata-tags=["']([^"']+)["'][^>]*>/i
  );

  const slug = path.basename(articleDirRelPath);
  const articlePath = `/${articleDirRelPath.replace(/\\/g, '/')}/`;

  return {
    slug,
    path: articlePath,
    title_ja: titleJa,
    title_en: titleEn,
    tags_ja: parseCsvTags(tagsJaRaw),
    tags_en: parseCsvTags(tagsEnRaw),
  };
}

async function main() {
  const categoryRelPath = process.argv[2];
  const outputFileName = process.argv[3] || 'category-manifest.json';

  if (!categoryRelPath) {
    usage();
    process.exit(1);
  }

  const categoryAbsPath = path.join(rootDir, categoryRelPath);

  let entries;
  try {
    entries = await fs.readdir(categoryAbsPath, { withFileTypes: true });
  } catch {
    console.error(`Category path not found: ${categoryRelPath}`);
    process.exit(1);
  }

  const articleDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(categoryRelPath, entry.name))
    .sort((a, b) => a.localeCompare(b));

  const articles = [];
  for (const articleDirRelPath of articleDirs) {
    const indexPath = path.join(rootDir, articleDirRelPath, 'index.html');
    try {
      await fs.access(indexPath);
    } catch {
      continue;
    }

    const article = await parseArticle(articleDirRelPath);
    if (!article.title_ja || !article.title_en) {
      console.warn(`Skipped (missing title): ${articleDirRelPath}`);
      continue;
    }
    articles.push(article);
  }

  const manifest = {
    category: categoryRelPath,
    generated_at: new Date().toISOString(),
    article_count: articles.length,
    articles,
  };

  const outputPath = path.join(rootDir, categoryRelPath, outputFileName);
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Generated: ${path.relative(rootDir, outputPath)}`);
  console.log(`Articles: ${articles.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
