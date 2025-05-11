"use client";

import { FaRegShareFromSquare } from "react-icons/fa6";
import { FaRegBookmark } from "react-icons/fa";
import {
  DialogContent,
  DialogBody,
  DialogBackdrop,
  DialogRoot,
} from "@chakra-ui/react";
import { CgCloseO, CgProfile } from "react-icons/cg";
import Share from "./Share";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Meme, TagI } from "@/app/home/page";
import { MdOutlineExpandMore } from "react-icons/md";
import axiosInstance from "@/utils/axiosInstance";

interface MemeDetailProps {
  isOpen?: boolean;
  onClose?: () => void;
  meme: Meme | undefined;
  searchRelatedMemes: Dispatch<SetStateAction<string>>;
}
interface Category {
  name: string;
}

export default function MemeDetail({
  isOpen = true,
  onClose = () => {},
  meme,
  searchRelatedMemes,
}: MemeDetailProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [relatedMemes, setRelatedMemes] = useState<Meme[]>([]);

  const handleShareClose = () => {
    setIsShareOpen(false);
  };

  useEffect(() => {
    getRelatedMemes();
  }, [meme]);

  const getRelatedMemes = async () => {
    try {
      if (meme && meme.tags.length > 0) {
        let tags = "";
        meme.tags.map((t) => {
          if (tags.length > 0) {
            tags += `,${t.name}`;
          } else {
            tags = `${t.name}`;
          }
        });

        const response = await axiosInstance.get(`/api/meme?name=${tags}`);

        if (response.data.memes) {
          setRelatedMemes([...response.data.memes]);
        }
      }
      // if (meme.categories.length == 0 && memes.length > 0) {
      //   setRelatedMemes([...memes]);
      // }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {meme && (
        <DialogRoot open={isOpen} motionPreset="slide-in-bottom">
          <DialogBackdrop className="backdrop-blur-md" />
          <DialogContent className="fixed inset-2  bg-[#141e29] border border-white w-[60vw] h-[80vh] max-w-none p-0">
            <DialogBody className="overflow-y-auto p-10">
              <CgCloseO
                onClick={onClose}
                className="z-50 absolute -top-6 -right-4 text-white w-5 h-5 cursor-pointer"
              />
              <div className="flex items-start gap-1 mb-2">
                <CgProfile size={18} />
                <span className="text-[#29e0ca]">
                  {meme.created_by.username}
                </span>
              </div>

              <div className="grid md:grid-cols-12 gap-4">
                {/* left side */}
                <div className="w-96 h-96 col-span-5">
                  <img
                    src={meme.image_url}
                    alt={meme.name}
                    className="w-full cursor-pointer border-2 border-white"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="">
                      {/* <FaRegEye className="text-xl rotate-90" />
                      <p className="text-[#1783fb] text-center">13</p> */}
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => {
                          setIsShareOpen(true);
                        }}
                      >
                        <FaRegShareFromSquare className="text-xl cursor-pointer" />
                        <p className="text-[#1783fb] text-center">120</p>
                      </div>
                      <div>
                        <FaRegBookmark className="text-xl cursor-pointer" />
                        <p className="text-[#1783fb] text-center">24</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* right side */}
                <div className="col-span-7 space-y-6">
                  <div className="flex items-center gap-4">
                    <label className="text-[#1783fb] text-2xl">Title :</label>
                    <p className="text-2xl font-semibold">{meme.name}</p>
                  </div>
                  {meme.categories.length > 0 && (
                    <div className="flex flex-col">
                      <label className="text-[#1783fb] text-2xl">
                        Categories :
                      </label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {meme.categories.map(
                          (category: Category, index: number) => (
                            <button
                              key={index}
                              className="text-balance border-2 border-[#1783fb] rounded-lg px-3 py-1"
                            >
                              {category.name}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {meme.tags.length > 0 && (
                    <div className="flex flex-col">
                      <label className="text-[#1783fb] text-2xl">Tags :</label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {meme.tags.map((tag: TagI, index: number) => (
                          <button
                            key={index}
                            className="text-balance border-2 border-[#1783fb] rounded-lg px-3 py-1"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* <div className="flex items-center gap-4">
                    <label className="text-[#1783fb] text-2xl">
                      Vote Count:
                    </label>
                    <p className="text-2xl font-semibold">{meme.vote_count}</p>
                  </div> */}

                  <div className="flex items-center gap-4">
                    <label className="text-[#1783fb] text-2xl">
                      Uploaded on:
                    </label>
                    <p className="text-2xl font-semibold">{meme.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* Related content */}
              {relatedMemes.length > 0 && (
                <div className="col-span-12 mt-20">
                  <p className="text-3xl text-[#1783fb] mb-3">
                    Related Contents :
                  </p>
                  <div className="flex items-center gap-8">
                    {relatedMemes.map((item, index) => {
                      if (index < 6 && meme.name != item.name) {
                        return (
                          <div
                            key={item._id}
                            className="w-36 h-36 border-2 border-white cursor-pointer"
                            onClick={() => {
                              if (item.categories.length > 0) {
                                searchRelatedMemes(item.categories[0].name);
                                onClose();
                              }
                            }}
                          >
                            <img src={item.image_url} alt={"meme1"} />
                          </div>
                        );
                      }
                    })}
                  </div>
                  <div className="flex items-center text-center cursor-pointer border-2 border-white rounded-lg px-5 w-min mx-auto mt-8 py-1 ">
                    More <MdOutlineExpandMore className="text-2xl" />
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </DialogRoot>
      )}

      {isShareOpen && (
        <Share
          onClose={handleShareClose}
          imageUrl={meme?.image_url}
          id={meme?._id}
        />
      )}
    </>
  );
}
