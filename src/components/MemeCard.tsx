import { Meme } from "@/app/home/page";
import { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Logo } from "./Logo";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { FaRegBookmark } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Share from "./Share";
import { Tooltip } from "./ui/tooltip";
import { FaBookmark } from "react-icons/fa";
import { useUser } from "@account-kit/react";

export interface MemeCardI {
  index: number;
  meme: Meme;
  onOpenMeme: () => void;
  onVoteMeme: () => void;
  bookmark: (id: string, name: string, image_url: string) => void;
  activeTab?: "all" | "live";
}

export function MemeCard({
  index,
  meme,
  onOpenMeme,
  onVoteMeme,
  bookmark,
  activeTab = "all",
}: MemeCardI) {
  const [loading, setLoading] = useState(false);
  const { openConnectModal } = useConnectModal();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const user = useUser();

  useEffect(() => {
    getBookmarks();
    setBookmarkCount(meme.bookmarks.length);
    setShareCount(meme.shares.length);
    setVoteCount(meme.vote_count);
  }, []);

  const getBookmarks = () => {
    const bookmarks = localStorage.getItem("bookmarks");
    if (bookmarks) {
      const bookmarksObj = JSON.parse(bookmarks);
      if (bookmarksObj[meme._id]) {
        setIsBookmarked(true);
      } else {
        setIsBookmarked(false);
      }
    }
  };

  const handleShareClose = () => {
    setIsShareOpen(false);
  };

  const onShare = () => {
    setShareCount(shareCount + 1);
  };

  const voteMeme = () => {
    try {
      setLoading(true);
      onVoteMeme();
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div key={index} className="col-span-4 flex flex-col mx-auto">
      <div className="flex items-start gap-2 mb-2">
        <CgProfile size={28} />
        <span className="text-2xl text-[#29e0ca]">
          {meme.created_by?.username}
        </span>
      </div>
      <div className="flex cursor-pointer">
        <img
          onClick={() => {
            onOpenMeme();
          }}
          src={meme.image_url}
          alt={meme.name}
          className="border-2 h-96 w-96"
        />
        <div className="ml-4 place-content-end space-y-8">
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin text-2xl " />
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <Logo
                onClick={() => {
                  if (activeTab === "all") return; // Disable click in 'all' tab
                  if (user && user.address) {
                    voteMeme();
                  } else if (openConnectModal) {
                    openConnectModal();
                  }
                }}
                classNames={`${
                  activeTab === "all"
                    ? "opacity-70 !cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              />
              {activeTab !== "live" && (
                <p className="text-center">{voteCount}</p>
              )}
            </div>
          )}

          <Tooltip content="Share" positioning={{ placement: "right-end" }}>
            <div className="text-center font-bold text-lg">
              <FaRegShareFromSquare
                className="text-2xl"
                onClick={() => {
                  setIsShareOpen(true);
                }}
              />
              {meme.shares && !activeTab?.includes("live") && (
                <p>{shareCount}</p>
              )}
            </div>
          </Tooltip>

          {isBookmarked ? (
            <Tooltip
              content="My Bookmark"
              positioning={{ placement: "right-end" }}
            >
              <div className="text-center font-bold text-lg">
                <FaBookmark
                  className="text-2xl cursor-pointer"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount - 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p>{bookmarkCount}</p>
                )}
              </div>
            </Tooltip>
          ) : (
            <Tooltip
              content="My Bookmark"
              positioning={{ placement: "right-end" }}
            >
              <div className="text-center font-bold text-lg">
                <FaRegBookmark
                  className="text-2xl"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount + 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p>{bookmarkCount}</p>
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
      <p className="text-2xl text-wrap my-1 w-96 line-clamp-3">{meme.name}</p>
      {isShareOpen && (
        <Share
          onClose={handleShareClose}
          onShare={onShare}
          imageUrl={meme?.image_url}
          id={meme._id}
        />
      )}
    </div>
  );
}
