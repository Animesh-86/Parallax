import React, { useState, useEffect } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { searchFiles, FileSearchResult } from "../../services/fileApi";

type SearchPanelProps = {
  projectId: string;
  onSelect: (path: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

export function SearchPanel({ projectId, onSelect, query, onQueryChange }: SearchPanelProps) {
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchFiles(projectId, query);
        setResults(data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, projectId]);

  return (
    <div className="flex flex-col h-full bg-[#09090B] border-r border-white/5 font-sans">
      <div className="flex-none p-4 pb-2 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Search
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all pl-8"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center p-4 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Searching...
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="p-4 text-center text-sm text-white/40">
            No results found.
          </div>
        )}

        {!loading && results.map((result, index) => (
          <div
            key={index}
            onClick={() => onSelect(result.path)}
            className="group mb-1 p-2 rounded cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs text-white/80 font-medium truncate">
                {result.path}
              </span>
              <span className="text-[10px] text-white/40 ml-auto flex-shrink-0">
                Line {result.lineNumber}
              </span>
            </div>
            <div className="text-xs text-white/50 font-mono truncate pl-5">
              {result.lineContent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
