import { CgProfile } from "react-icons/cg";
import { LeaderboardMeme } from "./page";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { FaBookmark } from "react-icons/fa";
import { useEffect, useState } from "react";
import Share from "@/components/Share";
import { useMemeActions } from "../bookmark/bookmarkHelper";
import { CiBookmark } from "react-icons/ci";
import { useUser } from "@account-kit/react";

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
      <div className="flex justify-between items-center md:mb-1 md:mr-20">
        <div className="flex items-center gap-x-1 md:gap-x-2">
          <CgProfile className="md:w-7 md:h-7" />
          <span className="text-[#29e0ca] text-base md:text-2xl">
            {meme.created_by.username}
          </span>
        </div>
        <p className="text-[#29e0ca] text-base md:text-2xl font-medium">
          #{meme.rank}
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-x-1">
        <div className="">
          <div className="w-full h-full sm:w-[16.875rem] sm:h-[16.875rem] md:w-[16rem] md:h-[16.875rem] lg:w-[15.625rem] lg:h-[15.625rem] xl:w-[22rem] xl:h-[22rem] object-cover border-2 border-white">
            <img
              onClick={() => {
                onOpenMeme();
              }}
              src={meme.image_url}
              alt={meme.name}
              className="w-full h-full"
            />
          </div>
          <div className="flex justify-between text-lg leading-tight md:text-xl">
            <p>{meme.name}</p>
            {/* <p>{meme.createdAt.split("T")[0]}</p> */}
          </div>
        </div>
        <div className="flex flex-row md:flex-col justify-between">
          <p className="text-[#1783fb] text-lg md:text-xl font-bold ml-2">
            {meme.in_percentile.toFixed(2)}%
          </p>
          <div className="flex flex-row justify-center md:justify-normal md:flex-col items-start gap-y-4 gap-x-6 md:gap-x-0 mb-14 md:mb-4">
            <div className="flex flex-col items-center">
              {activeTab === "all" && (
                <div
                  title="upvote"
                  className="upvote-img-wrapper cursor-pointer mb-5"
                >
                  <img
                    src={"/assets/upvote.svg"}
                    alt="vote"
                    className="w-4 h-4 md:w-10 md:h-10"
                    onClick={() => {
                      if (onUpvoteDownvote) {
                        onUpvoteDownvote(meme._id, "upvote");
                      }
                    }}
                  />
                </div>
              )}

              <img
                src={"/assets/vote-logo.svg"}
                alt="vote"
                className="w-4 h-4 md:w-7 md:h-7 cursor-not-allowed"
              />
              <span className="text-base md:text-2xl text-[#1783fb]">
                {meme.vote_count}
              </span>

              {activeTab === "all" && (
                <div
                  title="downvote"
                  className="downvote-img-wrapper cursor-pointer"
                >
                  <img
                    src={"/assets/downvote.svg"}
                    alt="vote"
                    className="w-4 h-4 md:w-10 md:h-10"
                    onClick={() => {
                      if (onUpvoteDownvote) {
                        onUpvoteDownvote(meme._id, "upvote");
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center ml-2">
              <FaRegShareFromSquare
                className="w-4 h-4 md:w-7 md:h-7 cursor-pointer"
                onClick={() => {
                  setIsShareOpen(true);
                }}
              />
              <span className="text-lg md:text-2xl text-[#1783fb]">0</span>
            </div>
            {user && user.address ? (
              <div>
                {isBookmarked ? (
                  <div className="flex flex-col items-center cursor-pointer ml-1">
                    <FaBookmark
                      className="w-4 h-4 md:w-7 md:h-7"
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
                  <div className="flex flex-col items-center cursor-pointer ml-1">
                    <CiBookmark
                      className="w-4 h-4 md:w-7 md:h-7"
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
