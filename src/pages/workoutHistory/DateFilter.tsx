type Props = {
    dateFilter: "1m" | "3m" | "all" | "manual";
    setDateFilter: (v: "1m" | "3m" | "all" | "manual") => void;
    manualStart: string;
    setManualStart: (s: string) => void;
    manualEnd: string;
    setManualEnd: (s: string) => void;
    setPage: (v: number | ((p: number) => number)) => void;
};

export default function DateFilter({ dateFilter, setDateFilter, manualStart, setManualStart, manualEnd, setManualEnd, setPage }: Props) {
    const options: Array<{ key: Props["dateFilter"]; label: string; title?: string }> = [
        ["1m", "1m"],
        ["3m", "3m"],
        ["all", "All"],
        ["manual", "Manual", "Manual date range"],
    ].map((item: any) => ({ key: item[0], label: item[1], title: item[2] }));

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Date:</span>
                <div className="flex gap-2">
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
                            className={dateFilter === opt.key ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                            title={opt.title}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {dateFilter === "manual" && (
                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={manualStart}
                        onChange={(e) => {
                            setPage(0);
                            setManualStart(e.target.value);
                        }}
                        className="h-10 px-2 rounded border border-border bg-background text-sm"
                    />
                    <input
                        type="date"
                        value={manualEnd}
                        onChange={(e) => {
                            setPage(0);
                            setManualEnd(e.target.value);
                        }}
                        className="h-10 px-2 rounded border border-border bg-background text-sm"
                    />
                </div>
            )}
        </div>
    );
}
