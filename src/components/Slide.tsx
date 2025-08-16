"use client";

import React, { useContext, useEffect, useState } from "react";
import { StackedCarouselSlideProps } from "react-stacked-center-carousel";
import "./Slide.css";
import { useAuthModal, useUser } from "@account-kit/react";
import { FaBookmark, FaRegShareFromSquare } from "react-icons/fa6";
import { CiBookmark } from "react-icons/ci";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { Logo } from "./Logo";
import { Tooltip } from "./ui/tooltip";
import { Context } from "@/context/contextProvider";

interface SlideProps extends StackedCarouselSlideProps {
  memeDetails: any;
  setSelectedMeme: (meme: any) => void;
  setIsMemeDetailOpen: (open: boolean) => void;
  bookmark: (id: string, name: string, image_url: string) => void;
  handleShare: (id: string, imageUrl: string) => void;
}

export const Slide = ({
  isCenterSlide,
  swipeTo,
  slideIndex,
  memeDetails,
  setSelectedMeme,
  setIsMemeDetailOpen,
  bookmark,
  handleShare,
  dataIndex,
}: SlideProps) => {
  const { userDetails } = useContext(Context);
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    getBookmarks();
  }, []);

  const getBookmarks = () => {
    const bookmarks = localStorage.getItem("bookmarks");
    if (bookmarks) {
      const bookmarksObj = JSON.parse(bookmarks);
      setIsBookmarked(!!bookmarksObj[memeDetails[dataIndex]?._id]);
    }
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
      <div className="card-card">
        <div className={`cover fill ${isCenterSlide ? "off" : "on"}`}>
          <div
            className="card-overlay fill"
            onClick={() => {
              if (!isCenterSlide) swipeTo(slideIndex);
            }}
          />
        </div>
        <div className="">
          <div className="aspect-square flex items-center justify-center rounded-lg cursor-pointer border-4 border-white">
            <img
              src={memeDetails[dataIndex]?.image_url}
              alt={memeDetails[dataIndex]?.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={() => {
                if (isCenterSlide) {
                  setSelectedMeme(memeDetails[dataIndex]);
                  setIsMemeDetailOpen(true);
                }
              }}
            />
          </div>
          {isCenterSlide && (
            <div className="grid grid-cols-12 mt-2">
              <div className="col-span-4" />
              {!memeDetails[dataIndex]?.is_onchain && (
                <div className="flex flex-col items-center text-center col-span-4">
                  <Logo
                    classNames="w-7 h-7 md:w-8 md:h-8"
                    onClick={() => {
                      if (user?.address) {
                        voteToMeme(memeDetails[dataIndex]?._id);
                      } else {
                        openAuthModal?.();
                      }
                    }}
                  />
                  <span className="text-sm md:text-lg">Vote</span>
                </div>
              )}
              <div className="flex col-span-4 justify-end">
                <Tooltip content="Share">
                  <FaRegShareFromSquare
                    className="w-6 h-6 md:w-8 md:h-8 mr-3 cursor-pointer"
                    onClick={() => {
                      handleShare(
                        memeDetails[dataIndex]?._id,
                        memeDetails[dataIndex]?.image_url
                      );
                    }}
                  />
                </Tooltip>
                {isBookmarked ? (
                  <Tooltip content="My Bookmark">
                    <FaBookmark
                      className="w-6 h-6 md:w-7 md:h-7 cursor-pointer"
                      onClick={() => {
                        if (user?.address) {
                          bookmark(
                            memeDetails[dataIndex]?._id,
                            memeDetails[dataIndex]?.name,
                            memeDetails[dataIndex]?.image_url
                          );
                          getBookmarks();
                        } else {
                          openAuthModal?.();
                        }
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip content="My Bookmarks">
                    <CiBookmark
                      className="w-6 h-6 md:w-8 md:h-8 cursor-pointer"
                      onClick={() => {
                        if (user?.address) {
                          bookmark(
                            memeDetails[dataIndex]?._id,
                            memeDetails[dataIndex]?.name,
                            memeDetails[dataIndex]?.image_url
                          );
                          getBookmarks();
                        } else {
                          openAuthModal?.();
                        }
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
