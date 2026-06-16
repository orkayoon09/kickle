import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type {
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints/common";
import type {
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints/data-sources";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion as any });

// 이미지 블록: 캡션 포함한 <figure> 태그로 렌더링
n2m.setCustomTransformer("image", async (block: any) => {
  const { image } = block;
  const url =
    image?.type === "external" ? image.external?.url : image?.file?.url;
  if (!url) return "";
  const caption = image?.caption?.map((c: any) => c.plain_text).join("") ?? "";
  if (caption) {
    return `<figure><img src="${url}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
  }
  return `<figure><img src="${url}" alt="" /></figure>`;
});

// 빈 단락 보존
n2m.setCustomTransformer("paragraph", async (block: any) => {
  const { paragraph } = block;
  const text = paragraph?.rich_text?.map((t: any) => {
    let content = t.plain_text;
    if (t.annotations?.bold) content = `**${content}**`;
    if (t.annotations?.italic) content = `*${content}*`;
    if (t.href) content = `[${content}](${t.href})`;
    return content;
  }).join("") ?? "";
  if (!text) return "<p>&nbsp;</p>";
  return `<p>${text}</p>`;
});

const DB_ID = process.env.NOTION_DATABASE_ID!;

export type Article = {
  id: string;
  title: string;
  subtitle: string;
  authors: string[];
  section: string;
  date: string;
  status: string;
  slug: string;
  cover: string | null;
};

function isPageObject(result: QueryDataSourceResponse["results"][number]): result is PageObjectResponse {
  return result.object === "page";
}

function getImageUrl(block: any): string | null {
  if (block.type !== "image") return null;
  const img = block.image;
  if (img?.type === "external") return img.external?.url ?? null;
  if (img?.type === "file") return img.file?.url ?? null;
  return null;
}

async function fetchFirstImageUrl(pageId: string): Promise<string | null> {
  try {
    const res = await notion.blocks.children.list({ block_id: pageId, page_size: 5 });
    for (const block of res.results as any[]) {
      const url = getImageUrl(block);
      if (url) return url;
    }
  } catch {}
  return null;
}

function parseArticle(page: PageObjectResponse): Article | null {
  const props = page.properties as Record<string, any>;

  const titleArr = props["이름"]?.title ?? [];
  const title = titleArr.map((t: any) => t.plain_text).join("") || "";

  const subtitleArr = props["부제"]?.rich_text ?? [];
  const subtitle = subtitleArr.map((t: any) => t.plain_text).join("") || "";

  // multi_select 또는 people 타입 모두 지원
  const rawAuthors = props["기자"];
  let authors: string[] = [];
  if (rawAuthors?.type === "multi_select") {
    authors = (rawAuthors.multi_select ?? []).map((p: any) => p.name ?? "");
  } else if (rawAuthors?.type === "people") {
    authors = (rawAuthors.people ?? []).map((p: any) => p.name ?? "");
  } else if (rawAuthors?.type === "select" && rawAuthors.select) {
    authors = [rawAuthors.select.name ?? ""];
  }

  const section = props["주제"]?.select?.name ?? "";
  const date = props["날짜"]?.date?.start ?? "";
  const status = props["발행여부/위치"]?.select?.name ?? "미발행";

  const slugArr = props["링크 텍스트"]?.rich_text ?? [];
  const slug = slugArr.map((t: any) => t.plain_text).join("").trim();

  if (!slug) return null;
  if (status === "미발행") return null;

  let cover: string | null = null;
  const pageCover = (page as any).cover;
  if (pageCover?.type === "external") {
    cover = pageCover.external.url;
  } else if (pageCover?.type === "file") {
    cover = pageCover.file.url;
  }

  return { id: page.id, title, subtitle, authors, section, date, status, slug, cover };
}

const publishedFilter = {
  and: [
    { property: "발행여부/위치", select: { does_not_equal: "미발행" } },
    { property: "링크 텍스트", rich_text: { is_not_empty: true } },
  ],
};

async function queryAll(filter: any): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined = undefined;
  try {
    do {
      const res = await notion.dataSources.query({
        data_source_id: DB_ID,
        filter,
        sorts: [{ property: "날짜", direction: "descending" }],
        start_cursor: cursor,
        page_size: 100,
      } as any);
      const pages = (res as any).results.filter(isPageObject) as PageObjectResponse[];
      results.push(...pages);
      cursor = (res as any).has_more ? ((res as any).next_cursor ?? undefined) : undefined;
    } while (cursor);
  } catch (err: any) {
    console.warn("[notion] queryAll failed:", err?.message ?? err);
  }
  return results;
}

async function attachThumbnails(articles: Article[]): Promise<Article[]> {
  return Promise.all(
    articles.map(async (article) => {
      if (article.cover) return article;
      const url = await fetchFirstImageUrl(article.id);
      return { ...article, cover: url };
    })
  );
}

export async function getPublishedArticles(): Promise<Article[]> {
  const pages = await queryAll(publishedFilter);
  const articles = pages.map(parseArticle).filter(Boolean) as Article[];
  return attachThumbnails(articles);
}

export async function getArticlesBySection(section: string): Promise<Article[]> {
  const filter = {
    and: [
      ...publishedFilter.and,
      { property: "주제", select: { equals: section } },
    ],
  };
  const pages = await queryAll(filter);
  const articles = pages.map(parseArticle).filter(Boolean) as Article[];
  return attachThumbnails(articles);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const filter = {
      and: [
        { property: "링크 텍스트", rich_text: { equals: slug } },
        { property: "발행여부/위치", select: { does_not_equal: "미발행" } },
      ],
    };
    const res = await notion.dataSources.query({
      data_source_id: DB_ID,
      filter,
    } as any);
    const page = (res as any).results.filter(isPageObject)[0] as PageObjectResponse | undefined;
    if (!page) return null;
    return parseArticle(page);
  } catch (err: any) {
    console.warn("[notion] getArticleBySlug failed:", err?.message ?? err);
    return null;
  }
}

export async function getArticleBlocks(pageId: string): Promise<string> {
  const blocks = await n2m.pageToMarkdown(pageId);
  return n2m.toMarkdownString(blocks).parent;
}

export async function getMainArticles(): Promise<{
  main1: Article | null;
  main2: Article | null;
  main3: Article | null;
}> {
  const all = await getPublishedArticles();

  const pick = (status: string) =>
    all.filter((a) => a.status === status).sort((a, b) =>
      b.date.localeCompare(a.date)
    )[0] ?? null;

  return {
    main1: pick("메인1기사"),
    main2: pick("메인2기사"),
    main3: pick("메인3기사"),
  };
}

export async function getAllSlugs(): Promise<string[]> {
  const pages = await queryAll(publishedFilter);
  return pages
    .map(parseArticle)
    .filter(Boolean)
    .map((a) => a!.slug);
}
