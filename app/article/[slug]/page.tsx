import {
  getArticleBySlug,
  getArticleBlocks,
  getArticlesBySection,
  getAllSlugs,
} from "@/lib/notion";
import ArticleCard from "@/components/ArticleCard";
import CopyButton from "@/components/CopyButton";
import Link from "next/link";
import Image from "next/image";
import { marked } from "marked";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const dynamicParams = true;

const SECTION_PATHS: Record<string, string> = {
  사회: "/sesang",
  교내: "/gyonae",
};

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  if (slugs.length === 0) return [{ slug: "placeholder" }];
  return slugs.map((slug) => ({ slug }));
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function estimateReadTime(text: string) {
  return Math.ceil(text.replace(/<[^>]+>/g, "").length / 700);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "placeholder") notFound();

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  let bodyHtml = "";
  let coverImage = article.cover;

  try {
    const markdown = await getArticleBlocks(article.id);
    const html = await marked(markdown);

    // 대표 이미지: 페이지 커버 우선, 없으면 본문 첫 이미지(figure 전체) 추출 후 제거
    if (!coverImage) {
      const figureMatch = html.match(/<figure>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/);
      if (figureMatch) {
        coverImage = figureMatch[1];
        bodyHtml = html.replace(figureMatch[0], "");
      } else {
        const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/);
        if (imgMatch) {
          coverImage = imgMatch[1];
          bodyHtml = html.replace(imgMatch[0], "");
        } else {
          bodyHtml = html;
        }
      }
    } else {
      bodyHtml = html;
    }
  } catch (err) {
    console.warn("[notion] getArticleBlocks failed:", err);
  }

  const readTime = estimateReadTime(bodyHtml);

  const sectionPath = article.section ? (SECTION_PATHS[article.section] ?? null) : null;

  // 같은 섹션 더 읽기 (최대 3개, 자신 제외)
  let related: Awaited<ReturnType<typeof getArticlesBySection>> = [];
  if (article.section) {
    try {
      const sectionArticles = await getArticlesBySection(article.section);
      related = sectionArticles.filter((a) => a.slug !== slug).slice(0, 3);
    } catch {}
  }

  return (
    <article className="max-w-[720px] mx-auto">
      {/* 섹션 태그 */}
      {article.section && sectionPath && (
        <Link
          href={sectionPath}
          className="inline-block text-sm font-semibold text-[#00B140] mb-3 hover:underline"
        >
          {article.section}
        </Link>
      )}

      {/* 제목 */}
      <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
        {article.title}
      </h1>

      {/* 부제 */}
      {article.subtitle && (
        <p className="text-gray-500 text-lg mb-4">{article.subtitle}</p>
      )}

      {/* 메타 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mb-6">
        {article.authors.length > 0 && (
          <span>{article.authors.join(", ")}</span>
        )}
        {article.date && (
          <>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
          </>
        )}
        {bodyHtml && (
          <>
            <span>·</span>
            <span>약 {readTime}분</span>
          </>
        )}
      </div>

      <hr className="border-gray-200 mb-6" />

      {/* 대표 이미지 */}
      {coverImage && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-md overflow-hidden">
          <Image
            src={coverImage}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* 본문 */}
      {bodyHtml && (
        <div
          className="notion-body text-[17px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      {/* 공유 버튼 */}
      <div className="mt-10 flex justify-center">
        <CopyButton />
      </div>

      <hr className="border-gray-200 mt-10 mb-8" />

      {/* 더 읽기 */}
      {related.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-4 text-gray-700">더 읽기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} variant="vertical" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
