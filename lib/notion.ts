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

function parseArticle(page: PageObjectResponse): Article | null {
  const props = page.properties as Record<string, any>;

  const titleArr = props["이름"]?.title ?? [];
  const title = titleArr.map((t: any) => t.plain_text).join("") || "";

  const subtitleArr = props["부제"]?.rich_text ?? [];
  const subtitle = subtitleArr.map((t: any) => t.plain_text).join("") || "";

  const authorPeople = props["기자"]?.people ?? [];
  const authors: string[] = authorPeople.map((p: any) => p.name ?? "");

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

export async function getPublishedArticles(): Promise<Article[]> {
  const pages = await queryAll(publishedFilter);
  return pages.map(parseArticle).filter(Boolean) as Article[];
}

export async function getArticlesBySection(section: string): Promise<Article[]> {
  const filter = {
    and: [
      ...publishedFilter.and,
      { property: "주제", select: { equals: section } },
    ],
  };
  const pages = await queryAll(filter);
  return pages.map(parseArticle).filter(Boolean) as Article[];
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
  const articles = await getPublishedArticles();
  return articles.map((a) => a.slug);
}
