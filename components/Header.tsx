import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-[#3D6B2E]">
      <div className="max-w-[1200px] mx-auto px-4 pt-5 pb-0 flex flex-col items-center gap-3">
        <Link href="/">
          <Image src="/logo-white.svg" alt="키클 KYCLE" width={160} height={58} priority />
        </Link>
        <nav className="relative flex items-center border-b-2 border-white/40 pb-2 w-full justify-center">
          <div className="flex gap-8">
            <Link
              href="/sesang"
              className="text-base font-semibold text-white hover:text-white/70 transition-colors"
            >
              사회
            </Link>
            <Link
              href="/gyonae"
              className="text-base font-semibold text-white hover:text-white/70 transition-colors"
            >
              교내
            </Link>
          </div>
          <Link
            href="/search"
            aria-label="검색"
            className="absolute right-0 text-white/70 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
