
type Props = {
    dateFilter: "1m" | "3m" | "all" | "manual";
    setDateFilter: (v: "1m" | "3m" | "all" | "manual") => void;
    manualStart: string;
    setManualStart: (s: string) => void;
    manualEnd: string;
    setManualEnd: (s: string) => void;
};

export default function DateFilter({ dateFilter, setDateFilter, manualStart, setManualStart, manualEnd, setManualEnd }: Props) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Date:</span>
                <div className="flex gap-2">
                    {(["1m", "3m", "all", "manual"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setDateFilter(v)}
                            className={dateFilter === v ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                            title={v}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {dateFilter === "manual" && (
                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={manualStart}
                        onChange={(e) => setManualStart(e.target.value)}
                        className="h-10 px-2 rounded border border-border bg-background text-sm"
                    />
                    <input
                        type="date"
                        value={manualEnd}
                        onChange={(e) => setManualEnd(e.target.value)}
                        className="h-10 px-2 rounded border border-border bg-background text-sm"
                    />
                </div>
            )}
        </div>
    );
}
