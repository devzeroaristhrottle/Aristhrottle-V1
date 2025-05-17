"use client";

import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { FaRegBookmark, FaRegEye } from "react-icons/fa";
import { FaRegShareFromSquare } from "react-icons/fa6";
import "react-datepicker/dist/react-datepicker.css";
import { CgProfile } from "react-icons/cg";
import { HStack } from "@chakra-ui/react";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import axiosInstance from "@/utils/axiosInstance";
import { Context } from "@/context/contextProvider";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useFilterAndSort } from "@/hooks/useFilterAndSort";
import { FilterPopover } from "@/components/FilterPopover";
import { SortPopover } from "@/components/SortPopover";
import { TabButton } from "@/components/TabButton";

export interface Meme {
  _id: string;
  vote_count: number;
  name: string;
  image_url: string;
  tags: TagI[];
  categories: Category[]; // Assuming categories is an array of strings, modify as needed
  created_by: User;
  createdAt: string; // ISO 8601 format date
  updatedAt: string; // ISO 8601 format date
  winning_number: number;
  in_percentile: number;
  rank?: number;
  __v: number;
}

interface Category {
  name: string;
}

export interface TagI {
  _id: string;
  count: number;
  name: string;
  type: "Seasonal" | "Event"; // You can expand or modify this as needed
  startTime: string; // ISO 8601 format date
  endTime: string; // ISO 8601 format date
  created_by: string; // User ID that created the tag
  __v: number;
  createdAt: string; // ISO 8601 format date
  updatedAt: string; // ISO 8601 format date
}

interface User {
  _id: string;
  username: string;
  user_wallet_address: string;
  createdAt: string; // ISO 8601 format date
  updatedAt: string; // ISO 8601 format date
  __v: number;
}

const MemeCard: React.FC<{ meme: Meme }> = ({ meme }) => (
  <div className="p-4 md:p-4 w-full">
    <div className="flex justify-between items-center md:mb-1 md:mr-20">
      <div className="flex items-center gap-x-1 md:gap-x-2">
        <CgProfile className="md:w-7 md:h-7" />
        <span className="text-[#29e0ca] text-base md:text-2xl">
          {meme.created_by.username}
        </span>
      </div>
      <p className="text-[#29e0ca] text-base md:text-2xl font-medium">
        #{meme.winning_number ? meme.winning_number : meme.rank}
      </p>
    </div>
    <div className="flex flex-col md:flex-row gap-x-1">
      <div className="relative flex-grow">
        <img
          src={meme.image_url}
          alt="Content"
          className="w-full aspect-square object-cover border-2 border-white"
        />
        <div className="flex justify-between text-lg leading-tight md:text-xl">
          <p>{meme.name}</p>
          <p>{meme.createdAt.split("T")[0]}</p>
        </div>
      </div>
      <div className="flex flex-row md:flex-col justify-between">
        <div>
          <p className=" text-[#1783fb] text-lg md:text-2xl font-bold md:ml-1">
            {meme.in_percentile.toFixed(2)}%
          </p>
        </div>
        <div className="flex flex-row justify-center md:justify-normal md:flex-col gap-x-6 md:gap-x-0 mb-14 md:mb-4">
          <div className="flex flex-col items-center">
            <FaRegEye className="rotate-90 w-4 h-4 md:w-6 md:h-6" />
            <span className="text-base md:text-2xl text-[#1783fb]">
              {meme.vote_count}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <FaRegShareFromSquare className="w-4 h-4 md:w-6 md:h-6" />
            <span className="text-lg md:text-2xl text-[#1783fb]">0</span>
          </div>
          <div className="flex flex-col items-center">
            <FaRegBookmark className="w-4 h-4 md:w-6 md:h-6" />
            <span className="text-lg md:text-2xl text-[#1783fb]">0</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Page() {
  const router = useRouter();
  const { userDetails } = useContext(Context);
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "live">("daily");
  const [page, setPage] = useState(1);
  const [totalMemeCount, setTotalMemeCount] = useState<number>(0);
  const [totalVoteCount, setTotalVoteCount] = useState<number>(0);
  const [totalUploadCount, setTotalUploadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const {
    percentage,
    setPercentage,
    selectedTags,
    tagInput,
    dateRange,
    setDateRange,
    sortCriteria,
    filteredMemes,
    filteredTags,
    handleTagInputChange,
    handleTagClick,
    handleTagRemove,
    handleSort,
    handleResetSort,
    resetFilters,
  } = useFilterAndSort(memes, activeTab);

  const getMyMemes = async () => {
    try {
      if (!userDetails?._id) throw new Error("User not found");
      setLoading(true);
      const offset = 30 * (page - 1);
      const daily = activeTab === "daily";
      const response = await axiosInstance.get(
        `/api/leaderboard?daily=${daily}&offset=${offset}`
      );

      if (response.data.memes) {
        setTotalMemeCount(response.data.memesCount || 0);
        setTotalVoteCount(response.data.totalVotes[0]?.totalVotes || 0);
        setTotalUploadCount(response.data.totalUpload || 0);
        setMemes(response.data.memes);
      }
    } catch (error) {
      console.log(error);
      setTotalMemeCount(0);
      setTotalVoteCount(0);
      setTotalUploadCount(0);
      setMemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTotalMemeCount(0);
    setTotalVoteCount(0);
    setTotalUploadCount(0);
    setMemes([]);
    resetFilters(); // Reset filters when page, tab, or user changes
    getMyMemes();
  }, [userDetails, page, activeTab]);

  const applyFilters = () => {
    setPage(1);
    getMyMemes();
    setFilterOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setMemes([]);
    setActiveTab(tab.toLowerCase() as "live" | "all" | "daily");
  };

  return (
    <div className="flex flex-col md:max-w-7xl px-3 md:mx-auto md:p-8">
      {/* <div className="flex items-center justify-between">
        <div className="flex gap-1 md:gap-3 items-center justify-center">
          <h4 className="text-sm md:text-4xl">Total Votes -</h4>
          <span className="text-sm md:text-4xl">
            {totalVoteCount ? totalVoteCount : 0}
          </span>
        </div>
        <div className="flex gap-1 md:gap-3 items-center justify-center">
          <h4 className="text-sm md:text-4xl">Total Uploads -</h4>
          <span className="text-sm md:text-4xl">
            {totalUploadCount ? totalUploadCount : 0}
          </span>
        </div>
        <div className="flex gap-1 md:gap-3 items-center md:justify-center">
          <h4 className="text-sm md:text-4xl">Average Votes -</h4>
          <span className="text-sm md:text-4xl">
            {totalMemeCount === 0 || totalUploadCount === 0
              ? "0"
              : Math.round(totalMemeCount / totalUploadCount)}
          </span>
        </div>
      </div> */}

      <div className="flex flex-wrap md:flex-nowrap items-center justify-between">
        <div className="flex gap-1 md:gap-3 items-center justify-center w-1/2 md:w-auto">
          <h4 className="text-lg md:text-4xl">Total Votes -</h4>
          <span className="text-xl md:text-4xl">
            {totalVoteCount ? totalVoteCount : 0}
          </span>
        </div>
        <div className="flex gap-1 md:gap-3 items-center justify-center w-1/2 md:w-auto">
          <h4 className="text-lg md:text-4xl">Total Uploads -</h4>
          <span className="text-xl md:text-4xl">
            {totalUploadCount ? totalUploadCount : 0}
          </span>
        </div>
        <div className="flex gap-1 md:gap-3 items-center justify-center w-full md:w-auto mt-2 md:mt-0">
          <h4 className="text-lg md:text-4xl">Average Votes -</h4>
          <span className="text-xl md:text-4xl">
            {totalMemeCount === 0 || totalUploadCount === 0
              ? "0"
              : Math.round(totalMemeCount / totalUploadCount)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-x-2 my-3 md:my-4">
        <div className="flex space-x-1 md:space-x-8">
          <FilterPopover
            activeTab={activeTab}
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            percentage={percentage}
            setPercentage={setPercentage}
            selectedTags={selectedTags}
            tagInput={tagInput}
            dateRange={dateRange}
            setDateRange={setDateRange}
            filteredTags={filteredTags}
            handleTagInputChange={handleTagInputChange}
            handleTagClick={handleTagClick}
            handleTagRemove={handleTagRemove}
            resetFilters={resetFilters}
            applyFilters={applyFilters}
          />
          <SortPopover
            activeTab={activeTab}
            sortOpen={sortOpen}
            setSortOpen={setSortOpen}
            sortCriteria={sortCriteria}
            handleSort={handleSort}
            handleResetSort={handleResetSort}
          />
        </div>
        <div className="flex space-x-1 md:space-x-4">
          <button
            onClick={() => router.push("/home/profile")}
            className="font-medium text-[#1783fb] text-base md:text-2xl text-nowrap border-2 border-[#1783fb] rounded-md px-1 md:px-5 md:py-1"
          >
            My Uploads
          </button>
          <button
            onClick={() => router.push("/home/myVotes")}
            className="font-medium text-[#1783fb] text-base md:text-2xl text-nowrap border-2 border-[#1783fb] rounded-md px-1 md:px-5 md:py-1"
          >
            My Votes
          </button>
        </div>
      </div>

      <div className="flex items-center text-center gap-x-10 border-2 border-[#1783fb] rounded-10px px-3 py-2 mt-5 md:mt-0 mb-8 w-fit text-nowrap mx-auto">
        <TabButton
          classname="!px-8 md:!px-14"
          isActive={activeTab === "daily"}
          label="Daily"
          onClick={() => handleTabChange("Daily")}
        />
        <TabButton
          classname="!px-4 md:!px-9"
          isActive={activeTab === "all"}
          label="All-Time"
          onClick={() => handleTabChange("All")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8">
        
        {/* For mobile */}
        <div className="md:hidden w-full flex flex-col items-center justify-center">
          {filteredMemes.map((item, index) => (
            <div key={index} className="w-full max-w-sm">
              <MemeCard meme={item} />
            </div>
          ))}
        </div>

        {filteredMemes.map((item, index) => (
          <div key={index} className="hidden md:block">
            <MemeCard meme={item} />
          </div>
        ))}
        <div className="col-span-1 md:col-span-3">
          {loading && (
            <AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
          )}
          {!loading && filteredMemes.length === 0 && (
            <p className="text-center text-nowrap text-2xl mx-auto">
              Meme not found
            </p>
          )}
        </div>
        {filteredMemes.length > 0 && (
          <div className="col-span-1 md:col-span-3">
            <PaginationRoot
              count={totalMemeCount}
              pageSize={30}
              defaultPage={1}
              variant="solid"
              className="mx-auto"
              page={page}
              onPageChange={(e) => {
                setMemes([]);
                setPage(e.page);
              }}
            >
              <HStack className="justify-center mb-5">
                <PaginationPrevTrigger />
                <PaginationItems />
                <PaginationNextTrigger />
              </HStack>
            </PaginationRoot>
          </div>
        )}
      </div>
    </div>
  );
}
