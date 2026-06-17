import { getArticlesBySection } from "@/lib/notion";
import ArticleCard from "@/components/ArticleCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "교내 > 키클" };
export const revalidate = 3600;

export const dynamic = "force-static";

export default async function GyonaePage() {
  const articles = await getArticlesBySection("교내");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 pb-2 border-b-2 border-[#00B140] inline-block">
        교내
      </h1>
      <div className="mt-6">
        {articles.length === 0 ? (
          <p className="text-gray-400 text-sm">발행된 기사가 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="horizontal" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
