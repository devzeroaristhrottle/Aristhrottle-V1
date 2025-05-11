"use client";


import { Context } from "@/context/contextProvider";

import React, { useContext, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type Props = {};

// interface TabButtonProps {
//   label: string;
//   isActive: boolean;
// }

interface MyVotedMeme {
  [key: string]: { id: string; name: string; image_url: string };
}

export default function Page({}: Props) {

  const [loading, setLoading] = useState<boolean>(false);
  const [memes, setMemes] = useState<MyVotedMeme>();

  const { userDetails } = useContext(Context);



  useEffect(() => {
    getMyMemes();
  }, [userDetails]);

  const getMyMemes = async () => {
    try {
      setLoading(true);
      const bookmarks = localStorage.getItem("bookmarks");
      if (bookmarks) {
        const bookmarksObj: {
          [key: string]: { id: string; name: string; image_url: string };
        } = JSON.parse(bookmarks);
        setMemes(bookmarksObj);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto p-8">
      <h2 className="cursor-pointer text-[#29e0ca] text-4xl font-medium text-center mb-10">
        My Bookmarks
      </h2>

      <div className="grid grid-cols-3 gap-8">
        {memes &&
          Object.entries(memes).map((item, index) => (
            <div key={index} className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-grow">
                  <img
                    src={item[1].image_url}
                    alt="Content"
                    className="w-full aspect-square object-cover border-2 border-white"
                  />
                  <div className="flex justify-between">
                    <p>{item[1].name}</p>
                  </div>
                </div>

                {/* <div className="flex flex-col justify-between mb-7">
                <div>
                  <p className="text-[#1783fb] text-lg font-bold">
                    {item.votes}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center">
                    <FaRegEye className="rotate-90" size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.views}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FaRegShareFromSquare size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.shares}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FaRegBookmark size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.saves}
                    </span>
                  </div>
                </div>
              </div> */}
              </div>
            </div>
          ))}
        <div className="col-span-3">
          {loading && (
            <AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto col-span-12" />
          )}
          {!loading && !memes && (
            <p className="text-center text-nowrap text-2xl mx-auto col-span-12">
              Meme not found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
