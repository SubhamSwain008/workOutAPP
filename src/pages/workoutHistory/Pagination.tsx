
type Props = {
    page: number;
    setPage: (v: number | ((p: number) => number)) => void;
};

export default function Pagination({ page, setPage }: Props) {
    return (
        <div className="flex justify-between pt-4">
            <button
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage((p: number) => p - 1)}
                className="px-4 py-2 border border-border rounded disabled:opacity-40"
                title="Previous"
            >
                Previous
            </button>

            <button
                aria-label="Next page"
                onClick={() => setPage((p: number) => p + 1)}
                className="px-4 py-2 border border-border rounded"
                title="Next"
            >
                Next
            </button>
        </div>
    );
}
