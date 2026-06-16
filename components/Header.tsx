import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col items-center gap-3">
        <Link href="/">
          <Image src="/logo.svg" alt="키클 KYCLE" width={160} height={58} priority />
        </Link>
        <nav className="flex gap-8 border-b-2 border-[#00B140] pb-1 w-full justify-center">
          <Link
            href="/sesang"
            className="text-base font-semibold text-[#111111] hover:text-[#00B140] transition-colors"
          >
            사회
          </Link>
          <Link
            href="/gyonae"
            className="text-base font-semibold text-[#111111] hover:text-[#00B140] transition-colors"
          >
            교내
          </Link>
        </nav>
      </div>
    </header>
  );
}
