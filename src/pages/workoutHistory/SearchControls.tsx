type Props = {
  search: string;
  setSearch: (s: string) => void;
  searchMode: "exercise" | "day";
  setSearchMode: (m: "exercise" | "day") => void;
  rowsPerPage?: number;
  setRowsPerPage?: (n: number) => void;
  onExport?: () => void;
  setPage: (v: number | ((p: number) => number)) => void;
  showExtras?: boolean;
};

import { Search, Download } from "lucide-react";

export default function SearchControls({
  search,
  setSearch,
  searchMode,
  setSearchMode,
  rowsPerPage,
  setRowsPerPage,
  onExport,
  setPage,
  showExtras = true,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      {/* -------- Search box with mode toggle -------- */}
      <div className="flex items-center gap-2 w-full sm:max-w-lg">

        {/* Segmented control */}
        <div className="flex rounded-lg border border-border overflow-hidden bg-secondary">
          <button
            onClick={() => {
              setPage(0);
              setSearchMode("exercise");
            }}
            aria-pressed={searchMode === "exercise"}
            className={`px-3 py-1.5 text-xs font-medium transition-colors
              ${searchMode === "exercise"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Exercise
          </button>

          <button
            onClick={() => {
              setPage(0);
              setSearchMode("day");
            }}
            aria-pressed={searchMode === "day"}
            className={`px-3 py-1.5 text-xs font-medium transition-colors
              ${searchMode === "day"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Day
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="w-4 h-4" aria-hidden />
          </span>

          <input
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder={
              searchMode === "exercise"
                ? "Search by exercise name"
                : "Search by workout day"
            }
            className="
              w-full h-9 rounded-lg border border-input
              bg-background pl-9 pr-3 text-sm
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring
            "
            aria-label={`Search by ${searchMode}`}
          />
        </div>
      </div>

      {/* -------- Extras -------- */}
      {showExtras && (
        <div className="flex items-center gap-2 self-end sm:self-auto">

          {setRowsPerPage && (
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="
                h-9 rounded-lg border border-input
                bg-background px-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-ring
              "
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="
                min-h-[44px] h-9 px-4 rounded-xl border border-border
                bg-background text-sm font-medium text-foreground
                hover:bg-muted active:scale-[0.98] transition-all duration-200
                flex items-center gap-2 touch-manipulation
                shadow-sm hover:shadow-md
              "
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
