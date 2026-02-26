
import { Search } from "lucide-react";

type Props = {
    search: string;
    setSearch: (s: string) => void;
    searchMode: "exercise" | "day";
    setSearchMode: (m: "exercise" | "day") => void;
};

export default function SearchBar({ search, setSearch, searchMode, setSearchMode }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 w-full sm:max-w-lg">
                <div className="flex rounded-lg border border-border overflow-hidden bg-secondary">
                    <button
                        onClick={() => setSearchMode("exercise")}
                        aria-pressed={searchMode === "exercise"}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "exercise" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Exercise
                    </button>

                    <button
                        onClick={() => setSearchMode("day")}
                        aria-pressed={searchMode === "day"}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Day
                    </button>
                </div>

                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="w-4 h-4" aria-hidden />
                    </span>

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchMode === "exercise" ? "Search exercise" : "Search day"}
                        className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
        </div>
    );
}
