import React, { useState } from "react";
import { FaWhatsapp, FaTelegram, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentUrl?: string;
    contentTitle?: string;
    referralCode?: string;
}

const SHARE_PLATFORMS = [
    {
        name: "WhatsApp",
        icon: FaWhatsapp,
        color: "#25D366",
        url: (contentUrl: string, contentTitle: string, referralCode?: string) => {
            const message = `Check out this post from Aristhrottle: ${contentTitle}`;
            const fullUrl = `${contentUrl}${referralCode ? `?ref=${referralCode}` : ''}`;
            return `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${fullUrl}`)}`;
        }
    },
    {
        name: "Telegram",
        icon: FaTelegram,
        color: "#0088cc",
        url: (contentUrl: string, contentTitle: string, referralCode?: string) => {
            const message = `Check out this post from Aristhrottle: ${contentTitle}`;
            const fullUrl = `${contentUrl}${referralCode ? `?ref=${referralCode}` : ''}`;
            return `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(message)}`;
        }
    },
    {
        name: "Twitter",
        icon: FaTwitter,
        color: "#1DA1F2",
        url: (contentUrl: string, contentTitle: string, referralCode?: string) => {
            const message = `Check out this post from Aristhrottle: ${contentTitle}`;
            const fullUrl = `${contentUrl}${referralCode ? `?ref=${referralCode}` : ''}`;
            return `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(message)}`;
        }
    },
    {
        name: "Instagram",
        icon: FaInstagram,
        color: "#E4405F",
        url: (contentUrl: string, contentTitle: string, referralCode?: string) => {
            const fullUrl = `${contentUrl}${referralCode ? `?ref=${referralCode}` : ''}`;
            return `https://www.instagram.com/?url=${encodeURIComponent(fullUrl)}`;
        }
    },
    {
        name: "Facebook",
        icon: FaFacebook,
        color: "#1877F2",
        url: (contentUrl: string, contentTitle: string, referralCode?: string) => {
            const fullUrl = `${contentUrl}${referralCode ? `?ref=${referralCode}` : ''}`;
            return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        }
    }
];

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    contentUrl = "",
    contentTitle = "Check this out!",
    referralCode
}) => {
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleShare = (platform: typeof SHARE_PLATFORMS[0]) => {
        const shareUrl = platform.url(contentUrl, contentTitle, referralCode);
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback(`${type} copied!`);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div
                className="p-6 w-full max-w-md mx-auto relative flex flex-col z-50"
                style={{ backgroundColor: "#707070", borderRadius: '1.5rem' }}
            >
                <button
                    className="absolute top-1 right-3 text-gray-300 hover:text-white text-4xl leading-none"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Copy Feedback */}
                {copyFeedback && (
                    <div className="mb-4 p-2 bg-green-600 text-white text-sm rounded text-center">
                        {copyFeedback}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Content URL Box - Only show if contentUrl exists */}
                    {contentUrl && (
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Content URL</label>
                            <div className="flex items-center justify-center gap-0">
                                <div className="flex-1 px-3 py-1 rounded-l-lg border border-white text-white text-sm overflow-hidden border-r-0"
                                    style={{borderTopLeftRadius: "0.5rem", borderBottomLeftRadius: "0.5rem"}}
                                    >
                                    <div className="truncate">{contentUrl}</div>
                                </div>
                                <button
                                    onClick={() => handleCopy(contentUrl, 'URL')}
                                    className="px-3 py-1 rounded-r-lg bg-[#29E0CA] text-white hover:opacity-90 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Referral Code Box - Only show if referralCode exists */}
                    {referralCode && (
                        <div className="space-y-2">
                            <label className="text-white text-sm font-medium">Referral Code</label>
                            <div className="flex items-center justify-center gap-0">
                                <div className="w-24 px-3 py-1 rounded-l-lg border border-white text-white text-sm text-center border-r-0"
                                    style={{borderTopLeftRadius: "0.5rem", borderBottomLeftRadius: "0.5rem"}}
                                    >
                                    {referralCode}
                                </div>
                                <button
                                    onClick={() => handleCopy(referralCode, 'Referral code')}
                                    className="px-3 py-1 rounded-r-lg bg-[#29E0CA] text-white hover:opacity-90 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Social Media Share Buttons */}
                    <div className="">
                        <div className="flex justify-center gap-4 flex-wrap">
                            {SHARE_PLATFORMS.map((platform) => (
                                <button
                                    key={platform.name}
                                    onClick={() => handleShare(platform)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                                    style={{ backgroundColor: platform.color }}
                                    title={`Share on ${platform.name}`}
                                >
                                    <platform.icon className="text-white text-lg" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;