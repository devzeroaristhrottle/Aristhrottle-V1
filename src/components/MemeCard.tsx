import { Meme } from "@/app/home/page";
import { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Logo } from "./Logo";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { FaRegBookmark } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Share from "./Share";
import { Tooltip } from "./ui/tooltip";
import { FaBookmark } from "react-icons/fa";
import { useUser, useAuthModal } from "@account-kit/react";
import Image from "next/image";

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
  const { openAuthModal } = useAuthModal();
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
    <div key={index} className="flex flex-col">
      <div className="flex items-start gap-x-1 md:gap-x-2 mb-1 md:mb-2">
        <CgProfile className="md:w-7 md:h-7" />
        <span className="text-[#29e0ca] text-base md:text-2xl">
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
          className="w-full h-full md:w-[270px] md:h-[270px] lg:w-[250px] lg:h-[250px] xl:w-[360px] xl:h-[360px] object-cover border-2 border-white"
        />
        {/* For above mobile */}
        <div className="hidden md:block ml-3 place-content-end space-y-8">
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin text-2xl" />
          ) : (
            <div className="flex flex-col items-center font-bold text-xl space-y-1">
              {meme.voted ? (
                <>
                  <Image
                    src={"/assets/vote/icon1.png"}
                    width={30}
                    height={30}
                    alt="logo"
                    className="transition-all duration-300 "
                  />
                </>
              ) : (
                <Logo
                  onClick={() => {
                    if (activeTab === "all") return; // Disable click in 'all' tab
                    if (user && user.address) {
                      voteMeme();
                    } else if (openAuthModal) {
                      openAuthModal();
                    }
                  }}
                  classNames={`${
                    activeTab === "all"
                      ? "opacity-70 !cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                />
              )}

              {activeTab !== "live" && (
                <p className="text-center text-[#1783fb]">{voteCount}</p>
              )}
            </div>
          )}

          <Tooltip content="Share" positioning={{ placement: "right-end" }}>
            <div className="text-center font-bold text-xl">
              <FaRegShareFromSquare
                className="text-2xl"
                onClick={() => {
                  setIsShareOpen(true);
                }}
              />
              {meme.shares && !activeTab?.includes("live") && (
                <p className="text-[#1783fb]">{shareCount}</p>
              )}
            </div>
          </Tooltip>

          {isBookmarked ? (
            <Tooltip
              content="My Bookmark"
              positioning={{ placement: "right-end" }}
            >
              <div className="text-center font-bold text-xl">
                <FaBookmark
                  className="text-2xl cursor-pointer"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount - 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p className="text-[#1783fb]">{bookmarkCount}</p>
                )}
              </div>
            </Tooltip>
          ) : (
            <Tooltip
              content="My Bookmark"
              positioning={{ placement: "right-end" }}
            >
              <div className="text-center font-bold text-xl">
                <FaRegBookmark
                  className="text-2xl"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount + 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p className="text-[#1783fb]">{bookmarkCount}</p>
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <p className="text-lg md:text-2xl text-wrap">{meme.name}</p>
        {/* For mobile */}
        <div className="md:hidden flex items-center gap-x-6 md:gap-x-0">
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin text-2xl " />
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <Logo
                onClick={() => {
                  if (activeTab === "all") return; // Disable click in 'all' tab
                  if (user && user.address) {
                    voteMeme();
                  } else {
                    if (openAuthModal) {
                      openAuthModal();
                    }
                  }
                }}
                classNames={`w-5 h-5 md:w-6 md:h-6 ${
                  activeTab === "all"
                    ? "opacity-70 !cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              />
              {activeTab !== "live" && (
                <p className="text-center text-lg md:text-2xl text-[#1783fb]">
                  {voteCount}
                </p>
              )}
            </div>
          )}

          <Tooltip content="Share" positioning={{ placement: "right-end" }}>
            <div className="text-center font-bold">
              <FaRegShareFromSquare
                className="w-5 h-5 md:w-6 md:h-6 cursor-pointer"
                onClick={() => {
                  setIsShareOpen(true);
                }}
              />
              {meme.shares && !activeTab?.includes("live") && (
                <p className="text-lg md:text-2xl text-[#1783fb]">
                  {shareCount}
                </p>
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
                  className="w-5 h-5 md:w-6 md:h-6 cursor-pointer"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount - 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p className="text-lg md:text-2xl text-[#1783fb]">
                    {bookmarkCount}
                  </p>
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
                  className="w-5 h-5 md:w-6 md:h-6"
                  onClick={() => {
                    bookmark(meme._id, meme.name, meme.image_url);
                    setBookmarkCount(bookmarkCount + 1);
                    getBookmarks();
                  }}
                />
                {meme.bookmarks && !activeTab?.includes("live") && (
                  <p className="text-lg md:text-2xl text-[#1783fb]">
                    {bookmarkCount}
                  </p>
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
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
