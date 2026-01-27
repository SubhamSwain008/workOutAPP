import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";


type Props = {
    userPrompt: string;
    setUserPrompt: (s: string) => void;
    sendDisplayedToAI: () => Promise<void>;
    aiLoading: boolean;
    aiResponse: string;
    setAiResponse: (s: string) => void;
};

export default function AIControls({ userPrompt, setUserPrompt, sendDisplayedToAI, aiLoading, aiResponse, setAiResponse }: Props) {
    const parseTag = (tag: string) => {
        if (!aiResponse) return null;
        const re = new RegExp(`<\\s*${tag}\\s*>([\\s\\S]*?)<\\/\\s*${tag}\\s*>`, "i");
        const m = aiResponse.match(re);
        return m ? m[1].trim() : null;
    };

    const parseListLines = (text: string | null) => {
        if (!text) return [];
        return text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => (l.startsWith("*") ? l.replace(/^\*\s?/, "") : l));
    };

    const review = parseTag("review");
    const mistakesRaw = parseTag("mistakes");
    const suggestionsRaw = parseTag("suggestions");
    const mistakes = parseListLines(mistakesRaw);
    const suggestions = parseListLines(suggestionsRaw);
    const [showReview, setShowReview] = useState(Boolean(review));
    const [showMistakes, setShowMistakes] = useState(mistakes.length > 0);
    const [showSuggestions, setShowSuggestions] = useState(suggestions.length > 0);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const r = Boolean(parseTag("review"));
        const ms = parseListLines(parseTag("mistakes")).length > 0;
        const ss = parseListLines(parseTag("suggestions")).length > 0;
        setShowReview(r);
        setShowMistakes(ms);
        setShowSuggestions(ss);
        // reset activeIndex to 0 when response changes
        setActiveIndex(0);
    }, [aiResponse]);

    return (
        <>
            <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full h-28 rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ask the AI about the filtered workouts"
            />

            <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={sendDisplayedToAI}
                        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground flex items-center w-full sm:w-auto justify-center"
                        disabled={aiLoading}
                    >
                        {aiLoading ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Thinking…
                            </>
                        ) : (
                            'Ask AI'
                        )}
                    </button>
                    <button onClick={() => { setAiResponse(''); }} className="h-9 px-3 rounded-lg border border-border text-sm w-full sm:w-auto">Clear</button>
                </div>
            </div>

            {aiResponse && (
                <div className="mt-3 space-y-3">
                    {/* Create an ordered list of available sections */}
                    {(() => {
                        const available: { key: string; title: string; content: string | string[] }[] = [];
                        if (review && showReview) available.push({ key: 'review', title: 'Review', content: review as string });
                        if (mistakes.length > 0 && showMistakes) available.push({ key: 'mistakes', title: 'Mistakes', content: mistakes });
                        if (suggestions.length > 0 && showSuggestions) available.push({ key: 'suggestions', title: 'Suggestions', content: suggestions });

                        if (available.length === 0) return null;

                        const maxIndex = available.length - 1;

                        // clamp activeIndex
                        const idx = Math.min(Math.max(0, activeIndex), maxIndex);

                        return (
                            <>
                                {available.length > 1 && (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-2">
                                        <div className="text-sm text-muted-foreground">Section:</div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                                                disabled={idx === 0}
                                                className={`h-8 px-3 rounded ${idx === 0 ? 'opacity-50 cursor-not-allowed' : 'btn'} text-sm w-full sm:w-auto`}
                                            >
                                                ‹ Prev
                                            </button>

                                            <div className="text-sm text-muted-foreground px-3">{available[idx].title} ({idx + 1}/{available.length})</div>

                                            <button
                                                onClick={() => setActiveIndex((i) => Math.min(maxIndex, i + 1))}
                                                disabled={idx === maxIndex}
                                                className={`h-8 px-3 rounded ${idx === maxIndex ? 'opacity-50 cursor-not-allowed' : 'btn'} text-sm w-full sm:w-auto`}
                                            >
                                                Next ›
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-card p-3 rounded-lg border border-border">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="text-sm font-semibold text-muted-foreground">{available[idx].title}</div>
                                        <div className="flex flex-col sm:flex-row items-center gap-2">
                                            <button
                                                className="h-9 px-3 rounded-lg text-sm w-full sm:w-auto"
                                                onClick={async () => {
                                                    try {
                                                        const toCopy = Array.isArray(available[idx].content) ? (available[idx].content as string[]).join('\n') : (available[idx].content as string);
                                                        await navigator.clipboard.writeText(toCopy);
                                                    } catch (e) {
                                                        console.error('copy failed', e);
                                                    }
                                                }}
                                            >
                                                Copy
                                            </button>
                                            <button className="h-9 px-3 rounded-lg border border-border text-sm w-full sm:w-auto" onClick={() => {
                                                // hide the current section and reset index to 0
                                                if (available[idx].key === 'review') setShowReview(false);
                                                if (available[idx].key === 'mistakes') setShowMistakes(false);
                                                if (available[idx].key === 'suggestions') setShowSuggestions(false);
                                                setActiveIndex(0);
                                            }}>Close</button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-foreground">
                                        {available[idx].key === 'review' && (
                                            <div className="whitespace-pre-wrap">{available[idx].content as string}</div>
                                        )}

                                        {available[idx].key === 'mistakes' && (
                                            <ul className="list-disc pl-5">
                                                {(available[idx].content as string[]).map((m, i) => (
                                                    <li key={i}>{m}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {available[idx].key === 'suggestions' && (
                                            <ul className="list-disc pl-5">
                                                {(available[idx].content as string[]).map((s, i) => (
                                                    <li key={i} className="mb-1">{s}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </>
    );
}
