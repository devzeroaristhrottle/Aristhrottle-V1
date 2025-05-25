"use client";

import { IoIosArrowBack } from "react-icons/io";
import React, {
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
} from "react";
import { IoIosArrowForward } from "react-icons/io";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { CiBookmark } from "react-icons/ci";
import "./Carousel.css"; // Assuming you've converted SCSS to CSS
import { Meme } from "@/app/home/page";
import { Logo } from "./Logo";
import { toast } from "react-toastify";
import { Context } from "@/context/contextProvider";
import axiosInstance from "@/utils/axiosInstance";
import Share from "./Share";
import { Tooltip } from "./ui/tooltip";
import { FaBookmark } from "react-icons/fa";
import { useAuthModal, useUser } from "@account-kit/react";

interface CarouselProps {
  items: Meme[];
  setIsMemeDetailOpen: (isOpen: boolean) => void;
  active: number;
  setSelectedMeme: Dispatch<SetStateAction<Meme | undefined>>;
  bookmark: (id: string, name: string, image_url: string) => void;
}

interface ItemProps {
  id: number;
  level: number;
  direction: string;
  setIsMemeDetailOpen: (isOpen: boolean) => void;
  memeDetails: Meme;
  setSelectedMeme: Dispatch<SetStateAction<Meme | undefined>>;
  bookmark: (id: string, name: string, image_url: string) => void;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  setIsMemeDetailOpen,
  active: initialActive,
  setSelectedMeme,
  bookmark,
}) => {
  const [active, setActive] = useState<number>(initialActive);
  const [direction, setDirection] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);

  const generateItems = useCallback(() => {
    const itemsToDisplay = [];
    for (let i = active - 2; i < active + 3; i++) {
      let index = i;
      if (i < 0) {
        index = items.length + i;
      } else if (i >= items.length) {
        index = i % items.length;
      }
      const level = active - i;

      if (items[index]) {
        itemsToDisplay.push(
          <Item
            key={i}
            id={i}
            level={level}
            direction={direction}
            memeDetails={items[index]}
            setIsMemeDetailOpen={setIsMemeDetailOpen}
            setSelectedMeme={setSelectedMeme}
            bookmark={bookmark}
          />
        );
      }
    }
    return itemsToDisplay;
  }, [active, items, direction]);

  const moveLeft = () => {
    const newActive = active - 1 < 0 ? items.length - 1 : active - 1;
    setActive(newActive);
    setDirection("left");
  };

  const moveRight = () => {
    const newActive = (active + 1) % items.length;
    setActive(newActive);
    setDirection("right");
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      moveRight();
    }, 3500);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [active, items, direction, isPaused]);

  return (
    <div
      id="carousel"
      className="block relative w-full md:max-w-[56.25rem] lg:max-w-[87.5rem] mx-auto noselect"
      onMouseEnter={() => setIsPaused(true)} // Pause on hover
      onMouseLeave={() => setIsPaused(false)} // Resume on unhover
    >
      <div
        className={`h-[18rem] md:h-[26.25rem] flex items-center ${direction}`}
      >
        <IoIosArrowBack
          className="text-lg md:text-2xl lg:text-4xl absolute left-0 cursor-pointer"
          onClick={moveLeft}
        />
        {generateItems()}
        <IoIosArrowForward
          className="text-lg md:text-2xl lg:text-4xl absolute right-0 cursor-pointer"
          onClick={moveRight}
        />
      </div>
    </div>
  );
};

const Item: React.FC<ItemProps> = ({
  level,
  direction,
  setIsMemeDetailOpen,
  memeDetails,
  setSelectedMeme,
  bookmark,
}) => {
  const className = `text-center text-white text-[2.5rem] absolute border-[.1875rem] border-white  item ${
    level != 0 && "brightness-50"
  } level${level} ${direction == "right" && level == -2 && "scale-anim"} ${
    direction == "left" && level == 2 && "scale-anim"
  }`;

  const { userDetails } = useContext(Context);
  const user = useUser();
  const { openAuthModal } = useAuthModal();

  const [isShareOpen, setIsShareOpen] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    getBookmarks();
  }, []);

  const getBookmarks = () => {
    const bookmarks = localStorage.getItem("bookmarks");
    if (bookmarks) {
      const bookmarksObj = JSON.parse(bookmarks);
      if (bookmarksObj[memeDetails._id]) {
        setIsBookmarked(true);
      } else {
        setIsBookmarked(false);
      }
    }
  };

  const handleShareClose = () => {
    setIsShareOpen(false);
  };

  const voteToMeme = async (vote_to: string) => {
    try {
      if (user && user.address) {
        const response = await axiosInstance.post("/api/vote", {
          vote_to: vote_to,
          vote_by: userDetails?._id,
        });
        if (response.status == 201 && response.statusText == "Created") {
          toast.success("Vote casted successfully!");
        }
      }
    } catch (error: any) {
      if (error.response.data.message === "You cannot vote on your own meme") {
        toast.error(error.response.data.message);
      } else {
        toast.error("Already voted to this meme");
      }
    }
  };

  return (
    <>
      <div className={className}>
        <img
          src={memeDetails.image_url}
          alt={memeDetails.name}
          className="cursor-pointer h-full w-full"
          onClick={() => {
            if (level == 0) {
              setSelectedMeme(memeDetails);
              setIsMemeDetailOpen(true);
            }
          }}
        />
        {level == 0 && (
          <div className="grid grid-cols-12 mt-2">
            <div className="col-span-4"></div>
            {!memeDetails.is_onchain && (
              <div className="flex flex-col items-center text-lg text-center col-span-4">
                <Logo
                  onClick={() => {
                    if (user && user.address) {
                      voteToMeme(memeDetails._id);
                    } else {
                      if (openAuthModal) {
                        openAuthModal();
                      }
                    }
                  }}
                />
                Vote
              </div>
            )}

            <div className="flex col-span-4 justify-end">
              <Tooltip content="Share" positioning={{ placement: "bottom" }}>
                <FaRegShareFromSquare
                  className="text-xl mr-3 cursor-pointer"
                  onClick={() => {
                    setIsShareOpen(true);
                  }}
                />
              </Tooltip>
              {isBookmarked ? (
                <Tooltip
                  content="My Bookmark"
                  positioning={{ placement: "right-end" }}
                >
                  <FaBookmark
                    className="text-xl cursor-pointer"
                    onClick={() => {
                      bookmark(
                        memeDetails._id,
                        memeDetails.name,
                        memeDetails.image_url
                      );
                      getBookmarks();
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip
                  content="My Bookmarks"
                  positioning={{ placement: "bottom" }}
                >
                  <CiBookmark
                    className="text-xl cursor-pointer"
                    onClick={() => {
                      bookmark(
                        memeDetails._id,
                        memeDetails.name,
                        memeDetails.image_url
                      );
                      getBookmarks();
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>

      {isShareOpen && (
        <Share
          onClose={handleShareClose}
          imageUrl={memeDetails?.image_url}
          id={memeDetails._id}
        />
      )}
    </>
  );
};
