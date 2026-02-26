import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
    page: number;
    setPage: (v: number | ((p: number) => number)) => void;
    totalPages?: number;
};

export default function Pagination({ page, setPage, totalPages }: Props) {
    const hasNext = totalPages ? page < totalPages - 1 : true;
    const hasPrev = page > 0;

    return (
        <div className="flex items-center justify-between gap-4 pt-4">
            <button
                aria-label="Previous page"
                disabled={!hasPrev}
                onClick={() => setPage((p: number) => Math.max(0, p - 1))}
                className="
                    min-h-[44px] px-4 py-2 rounded-xl border border-border
                    bg-background text-foreground text-sm font-medium
                    hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center gap-2
                    touch-manipulation
                "
                title="Previous"
            >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
            </button>

            {totalPages && (
                <div className="text-sm text-muted-foreground font-medium">
                    Page <span className="text-foreground font-semibold">{page + 1}</span> of <span className="text-foreground font-semibold">{totalPages}</span>
                </div>
            )}

            <button
                aria-label="Next page"
                disabled={totalPages ? !hasNext : false}
                onClick={() => setPage((p: number) => p + 1)}
                className="
                    min-h-[44px] px-4 py-2 rounded-xl border border-border
                    bg-background text-foreground text-sm font-medium
                    hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center gap-2
                    touch-manipulation
                "
                title="Next"
            >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
