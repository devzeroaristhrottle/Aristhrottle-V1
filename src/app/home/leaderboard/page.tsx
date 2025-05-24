"use client";

import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
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
import MemeDetail from "@/components/MemeDetail";
import { LeaderboardMemeCard } from "./MemeCard";

export type LeaderboardMeme = {
  _id: string;
  vote_count: number;
  name: string;
  image_url: string;
  created_by: {
    _id: string;
    username: string;
  };
  shares: any[]; // If you know the structure of shares, replace `any` with the appropriate type
  bookmarks: any[]; // Same as above
  createdAt: string; // ISO date string
  rank: number;
  in_percentile: number;
};

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

export default function Page() {
  const router = useRouter();
  const { userDetails } = useContext(Context);
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "live">("daily");
  const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState<
    LeaderboardMeme | undefined
  >();

  const [page, setPage] = useState(1);
  const [totalMemeCount, setTotalMemeCount] = useState<number>(0);
  const [totalVoteCount, setTotalVoteCount] = useState<number>(0);
  const [totalUploadCount, setTotalUploadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [memes, setMemes] = useState<LeaderboardMeme[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const onClose = () => {
    setIsMemeDetailOpen(false);
    setSelectedMeme(undefined);
  };

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
      setLoading(true);
      const offset = 30 * page;
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
              <LeaderboardMemeCard
                meme={item}
                onOpenMeme={() => {
                  setSelectedMeme(item);
                  setIsMemeDetailOpen(true);
                }}
              />
            </div>
          ))}
        </div>

        {filteredMemes.map((item, index) => (
          <div key={index} className="hidden md:block">
            <LeaderboardMemeCard
              meme={item}
              onOpenMeme={() => {
                setSelectedMeme(item);
                setIsMemeDetailOpen(true);
              }}
            />
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
              className="mx-auto mb-10"
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
      {/* Meme Detail Modal */}
      {isMemeDetailOpen && selectedMeme && (
        <MemeDetail onClose={onClose} meme={selectedMeme} />
      )}
    </div>
  );
}
