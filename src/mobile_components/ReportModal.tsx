import React, { useState } from "react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    memeId: string | null;
    onSubmit: (memeId: string, reason: string) => void;
}

const REPORT_OPTIONS = [
    "Spam",
    "Harassment",
    "Misinformation",
    "Dangerous",
    "Inappropriate Content",
    "Copyright Violation",
];

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    memeId,
    onSubmit,
}) => {
    const [selected, setSelected] = useState<string | null>(null);

    if (!isOpen || !memeId) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selected) {
            onSubmit(memeId, selected);
            setSelected(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 z-40" />

            {/* Modal */}
            <div
                className="rounded-lg p-6 w-11/12 max-w-sm mx-auto relative flex flex-col z-50"
                style={{ backgroundColor: "#707070" }}
            >
                <button
                    className="absolute top-2 right-2 text-gray-300 hover:text-white"
                    onClick={onClose}
                >
                    &times;
                </button>

                <h2 className="text-lg font-semibold mb-4 text-white">
                    Report Content
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <div className="flex flex-col gap-3 mb-6">
                        {REPORT_OPTIONS.map((option) => (
                            <label
                                key={option}
                                className="flex items-center gap-2 text-white cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="report-reason"
                                    value={option}
                                    checked={selected === option}
                                    onChange={() => setSelected(option)}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-auto">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 text-black"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded text-white font-semibold ${
                                !selected ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={!selected}
                            style={{ backgroundColor: "#9c0000" }}
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
