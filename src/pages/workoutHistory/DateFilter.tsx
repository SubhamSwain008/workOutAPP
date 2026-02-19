type Props = {
    dateFilter: "1m" | "3m" | "all" | "manual";
    setDateFilter: (v: "1m" | "3m" | "all" | "manual") => void;
    manualStart: string;
    setManualStart: (s: string) => void;
    manualEnd: string;
    setManualEnd: (s: string) => void;
    setPage: (v: number | ((p: number) => number)) => void;
};

import { Calendar as CalendarIcon } from "lucide-react";

export default function DateFilter({ dateFilter, setDateFilter, manualStart, setManualStart, manualEnd, setManualEnd, setPage }: Props) {
    const options: Array<{ key: Props["dateFilter"]; label: string; title?: string }> = [
        ["1m", "1m"],
        ["3m", "3m"],
        ["all", "All"],
        ["manual", "Manual", "Manual date range"],
    ].map((item: any) => ({ key: item[0], label: item[1], title: item[2] }));

    return (
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Date Range</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {options.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => {
                                setPage(0);
                                setDateFilter(opt.key);
                                if (opt.key !== "manual") {
                                    setManualStart("");
                                    setManualEnd("");
                                }
                            }}
                            className={`
                                min-h-[36px] px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation
                                ${dateFilter === opt.key
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-background border border-border text-foreground hover:bg-muted/50"
                                }
                            `}
                            title={opt.title}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {dateFilter === "manual" && (
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center pt-2 border-t border-border/50 animate-[workout-fade-in_0.2s_ease-out_both]">
                        <span className="text-xs text-muted-foreground font-medium">From:</span>
                        <input
                            type="date"
                            value={manualStart}
                            onChange={(e) => {
                                setPage(0);
                                setManualStart(e.target.value);
                            }}
                            className="min-h-[36px] h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                        />
                        <span className="text-xs text-muted-foreground font-medium">To:</span>
                        <input
                            type="date"
                            value={manualEnd}
                            onChange={(e) => {
                                setPage(0);
                                setManualEnd(e.target.value);
                            }}
                            className="min-h-[36px] h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
