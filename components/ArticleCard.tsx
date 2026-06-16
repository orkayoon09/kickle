import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/notion";

type Props = {
  article: Article;
  variant?: "horizontal" | "horizontal-lg" | "hero-side" | "vertical" | "large";
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function Thumb({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative bg-gray-100 overflow-hidden rounded-md ${className ?? ""}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
    </div>
  );
}

export default function ArticleCard({ article, variant = "horizontal" }: Props) {
  const href = `/article/${article.slug}`;
  const authorsStr = article.authors.join(", ");
  const dateStr = formatDate(article.date);
  const meta = [authorsStr, dateStr].filter(Boolean).join(" | ");

  if (variant === "large") {
    return (
      <Link href={href} className="block group h-full">
        <Thumb src={article.cover} alt={article.title} className="w-full h-64 md:h-80" />
        <div className="mt-3">
          <span className="text-xs font-semibold text-[#00B140]">{article.section}</span>
          <h2 className="text-xl font-bold leading-snug mt-1 group-hover:text-[#00B140] transition-colors line-clamp-2">
            {article.title}
          </h2>
          {article.subtitle && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{article.subtitle}</p>
          )}
          <p className="text-gray-400 text-xs mt-2">{meta}</p>
        </div>
      </Link>
    );
  }

  if (variant === "vertical") {
    return (
      <Link href={href} className="block group">
        <Thumb src={article.cover} alt={article.title} className="w-full h-36" />
        <div className="mt-2">
          <h3 className="text-base font-bold leading-snug group-hover:text-[#00B140] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-gray-400 text-xs mt-1">{meta}</p>
        </div>
      </Link>
    );
  }

  // hero-side: 메인 히어로 오른쪽 main2/main3용 — 이미지 좌 + 텍스트 우
  if (variant === "hero-side") {
    return (
      <Link href={href} className="flex gap-4 group py-4 first:pt-0 last:pb-0">
        <Thumb src={article.cover} alt={article.title} className="shrink-0 w-5/12 h-36 md:h-44" />
        <div className="flex flex-col justify-center min-w-0 gap-1">
          <span className="text-xs font-semibold text-[#00B140]">{article.section}</span>
          <h3 className="text-base md:text-lg font-bold leading-snug group-hover:text-[#00B140] transition-colors line-clamp-3">
            {article.title}
          </h3>
          {article.subtitle && (
            <p className="text-gray-500 text-sm line-clamp-2">{article.subtitle}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">{meta}</p>
        </div>
      </Link>
    );
  }

  // horizontal-lg: 최신 기사용 — 썸네일 1.5배 크기
  if (variant === "horizontal-lg") {
    return (
      <Link href={href} className="flex gap-5 group py-5 border-b border-gray-100 last:border-0">
        <Thumb src={article.cover} alt={article.title} className="shrink-0 w-36 h-[120px]" />
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-xs font-semibold text-[#00B140] mb-0.5">{article.section}</span>
          <h3 className="text-lg font-bold leading-snug group-hover:text-[#00B140] transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.subtitle && (
            <p className="text-gray-500 text-base mt-1 line-clamp-1">{article.subtitle}</p>
          )}
          <p className="text-gray-400 text-sm mt-1.5">{meta}</p>
        </div>
      </Link>
    );
  }

  // horizontal (default): 섹션 목록용
  return (
    <Link href={href} className="flex gap-4 group py-4 border-b border-gray-100 last:border-0">
      <Thumb src={article.cover} alt={article.title} className="shrink-0 w-24 h-20" />
      <div className="flex flex-col justify-center min-w-0">
        <h3 className="text-base font-bold leading-snug group-hover:text-[#00B140] transition-colors line-clamp-1">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{article.subtitle}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">{meta}</p>
      </div>
    </Link>
  );
}
