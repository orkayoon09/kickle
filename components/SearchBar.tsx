export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <form action="/search" method="get" className="flex gap-2 w-full max-w-xl">
      <input
        name="q"
        type="search"
        defaultValue={initialQuery}
        placeholder="제목, 기자, 주제로 검색..."
        autoComplete="off"
        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#00B140] focus:ring-1 focus:ring-[#00B140]"
      />
      <button
        type="submit"
        className="bg-[#00B140] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[#009935] transition-colors"
      >
        검색
      </button>
    </form>
  );
}
