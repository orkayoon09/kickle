"use client";

import { useState } from "react";

export default function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00B140] transition-colors border border-gray-200 rounded-full px-4 py-2"
    >
      {copied ? "✓ 복사됨" : "🔗 링크 복사"}
    </button>
  );
}
