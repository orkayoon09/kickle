import { getPublishedArticles } from "@/lib/notion";
import ArticleCard from "@/components/ArticleCard";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let results: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  if (query) {
    const all = await getPublishedArticles();
    const lower = query.toLowerCase();
    results = all.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.subtitle.toLowerCase().includes(lower) ||
        a.section.toLowerCase().includes(lower) ||
        a.authors.some((author) => author.toLowerCase().includes(lower))
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">기사 검색</h1>
      <SearchBar initialQuery={query} />

      {query && (
        <p className="text-sm text-gray-500 mt-4 mb-2">
          <span className="font-semibold text-gray-800">&ldquo;{query}&rdquo;</span> 검색 결과{" "}
          {results.length}건
        </p>
      )}

      {query && results.length === 0 && (
        <p className="text-gray-400 text-sm mt-6">검색 결과가 없습니다.</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 divide-y divide-gray-100">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} variant="horizontal-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
