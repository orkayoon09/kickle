import { getMainArticles, getPublishedArticles } from "@/lib/notion";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ main1, main2, main3 }, allArticles] = await Promise.all([
    getMainArticles(),
    getPublishedArticles(),
  ]);

  const mainSlugs = new Set(
    [main1, main2, main3].filter(Boolean).map((a) => a!.slug)
  );
  const latestArticles = allArticles
    .filter((a) => !mainSlugs.has(a.slug))
    .slice(0, 10);

  return (
    <div>
      {/* 메인 히어로 섹션 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* 메인1 — 좌측 대형 */}
        <div className="md:col-span-1">
          {main1 ? (
            <ArticleCard article={main1} variant="large" />
          ) : (
            <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 text-sm">
              메인1 기사 없음
            </div>
          )}
        </div>

        {/* 메인2·3 — 우측 2단 */}
        <div className="flex flex-col gap-4">
          {main2 ? (
            <ArticleCard article={main2} variant="vertical" />
          ) : (
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 text-sm">
              메인2 기사 없음
            </div>
          )}
          <div className="border-t border-gray-100" />
          {main3 ? (
            <ArticleCard article={main3} variant="vertical" />
          ) : (
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 text-sm">
              메인3 기사 없음
            </div>
          )}
        </div>
      </section>

      {/* 최신 기사 목록 */}
      <section>
        <h2 className="text-lg font-bold mb-2 pb-2 border-b-2 border-[#00B140] inline-block">
          최신 기사
        </h2>
        {latestArticles.length === 0 ? (
          <p className="text-gray-400 text-sm mt-4">발행된 기사가 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="horizontal" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
