import { CgProfile } from "react-icons/cg";
import { LeaderboardMeme } from "./page";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { FaBookmark } from "react-icons/fa";
import { useEffect, useState } from "react";
import Share from "@/components/Share";
import { useMemeActions } from "../bookmark/bookmarkHelper";
import { CiBookmark } from "react-icons/ci";
import { useUser } from "@account-kit/react";
import { BiDownArrow, BiUpArrow } from "react-icons/bi";

export const LeaderboardMemeCard: React.FC<{
  meme: LeaderboardMeme;
  onOpenMeme: () => void;
  onUpvoteDownvote?: (memeId: string, rating: string) => void;
  activeTab?: string;
}> = ({ meme, onOpenMeme, onUpvoteDownvote, activeTab }) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const user = useUser();

  const handleShareClose = () => {
    setIsShareOpen(false);
  };
  const { handleBookmark } = useMemeActions();
  useEffect(() => {
    getBookmarks();
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

  return (
    <div className="p-4 md:p-4 w-full lg:mx-auto">
      <div className="flex flex-col md:flex-row gap-x-1">
        <div className="flex flex-col">
          <div className="username_rank_wrapper flex justify-between items-center md:mb-1">
            <div className="flex items-center gap-x-1">
              <CgProfile className="md:w-6 md:h-6" />
              <span className="text-[#29e0ca] text-base md:text-2xl">
                {meme.created_by.username}
              </span>
            </div>
            <p className="text-[#29e0ca] text-base md:text-2xl font-medium">
              #{meme.rank}
            </p>
          </div>
          <div className="image_wrapper w-full h-full sm:w-[16.875rem] sm:h-[16.875rem] md:w-[16rem] md:h-[16.875rem] lg:w-[15.625rem] lg:h-[15.625rem] xl:w-[22rem] xl:h-[22rem] object-cover border-2 border-white">
            <img
              onClick={() => {
                onOpenMeme();
              }}
              src={meme.image_url}
              alt={meme.name}
              className="w-full h-full"
            />
          </div>
          <div className="title_wrapper flex justify-between text-lg leading-tight md:text-xl">
            <p>{meme.name}</p>
            {/* <p>{meme.createdAt.split("T")[0]}</p> */}
          </div>
        </div>
        <div className="flex flex-row md:flex-col justify-between ml-1 md:pt-8 md:pb-4">
          <p className="text-[#1783fb] text-lg md:text-xl font-bold">
            {meme.in_percentile.toFixed(2)}%
          </p>
          <div className="flex flex-row justify-center md:justify-normal md:flex-col items-center md:items-start gap-y-0 md:gap-y-5 gap-x-4 md:gap-x-0">
            <div className="flex flex-row md:flex-col items-start gap-x-0.5 md:gap-y-0 lg:gap-y-2">
              {activeTab === "all" && (
                <div title="upvote" className="upvote-wrapper cursor-pointer">
                  <BiUpArrow
                    className="w-3 h-3 md:w-5 md:h-5 lg:w-7 lg:h-7"
                    onClick={() => {
                      if (onUpvoteDownvote) {
                        onUpvoteDownvote(meme._id, "upvote");
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-center gap-x-2">
                <img
                  src={"/assets/vote-logo.svg"}
                  alt="vote"
                  className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 cursor-not-allowed"
                />
                <span className="text-base md:text-2xl text-[#1783fb]">
                  {meme.vote_count}
                </span>
              </div>

              {activeTab === "all" && (
                <div
                  title="downvote"
                  className="downvote-wrapper cursor-pointer"
                >
                  <BiDownArrow
                    className="w-3 h-3 md:w-5 md:h-5 lg:w-7 lg:h-7"
                    onClick={() => {
                      if (onUpvoteDownvote) {
                        onUpvoteDownvote(meme._id, "downvote");
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <FaRegShareFromSquare
                className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 cursor-pointer"
                onClick={() => {
                  setIsShareOpen(true);
                }}
              />
              <span className="text-lg md:text-2xl text-[#1783fb]">0</span>
            </div>
            {user && user.address ? (
              <div className="-ml-1">
                {isBookmarked ? (
                  <div className="flex flex-col items-center cursor-pointer">
                    <FaBookmark
                      className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8"
                      onClick={() => {
                        handleBookmark(meme._id, meme.name, meme.image_url);
                        getBookmarks();
                      }}
                    />
                    <span className="text-lg md:text-2xl text-[#1783fb]">
                      0
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center cursor-pointer">
                    <CiBookmark
                      className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8"
                      onClick={() => {
                        handleBookmark(meme._id, meme.name, meme.image_url);
                        getBookmarks();
                      }}
                    />
                    <span className="text-lg md:text-2xl text-[#1783fb]">
                      0
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {isShareOpen && (
        <Share
          onClose={handleShareClose}
          imageUrl={meme.image_url}
          id={meme._id}
        />
      )}
    </div>
  );
};
