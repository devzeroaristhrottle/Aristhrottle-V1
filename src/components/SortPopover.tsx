import React from "react";
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FaSort } from "react-icons/fa";
import {
  LiaSortAmountDownSolid,
  LiaSortAmountUpAltSolid,
} from "react-icons/lia";
import { MdRefresh } from "react-icons/md";

interface SortPopoverProps {
  activeTab: string;
  sortOpen: boolean;
  setSortOpen: (open: boolean) => void;
  sortCriteria: { field: "time" | "votes" | null; direction: "asc" | "desc" };
  handleSort: (field: "time" | "votes", direction: "asc" | "desc") => void;
  handleResetSort: () => void;
}

export const SortPopover: React.FC<SortPopoverProps> = ({
  activeTab,
  sortOpen,
  setSortOpen,
  sortCriteria,
  handleSort,
  handleResetSort,
}) => (
  <PopoverRoot open={sortOpen} onOpenChange={() => setSortOpen(!sortOpen)}>
    <PopoverTrigger asChild>
      <Button
        size={{ base: "2xs", md: "sm" }}
        variant="outline"
        className="flex gap-x-1 md:gap-x-2 border border-[#1783fb] px-1.5 md:px-3 rounded-full text-[#1783fb] text-lg md:text-xl hover:scale-105"
      >
        <FaSort />
        <span>sort</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="bg-[#141e29] w-52 left-16 bottom-0">
      <PopoverBody className="bg-[#141e29] border-2 border-[#1783fb] rounded-md p-0">
        <div className="flex justify-between items-center hover:bg-[#224063] px-4 py-1">
          <p className="text-xl">By Time</p>
          <div className="flex items-center gap-3">
            <LiaSortAmountUpAltSolid
              className={`cursor-pointer ${
                sortCriteria.field === "time" &&
                sortCriteria.direction === "asc"
                  ? "text-[#29e0ca]"
                  : ""
              }`}
              size={20}
              onClick={() => handleSort("time", "asc")}
            />
            <LiaSortAmountDownSolid
              className={`cursor-pointer ${
                sortCriteria.field === "time" &&
                sortCriteria.direction === "desc"
                  ? "text-[#29e0ca]"
                  : ""
              }`}
              size={20}
              onClick={() => handleSort("time", "desc")}
            />
          </div>
        </div>
        {activeTab !== "live" && (
          <div className="flex justify-between items-center hover:bg-[#224063] px-4 py-1">
            <p className="text-xl">By Votes</p>
            <div className="flex items-center gap-3">
              <LiaSortAmountUpAltSolid
                className={`cursor-pointer ${
                  sortCriteria.field === "votes" &&
                  sortCriteria.direction === "asc"
                    ? "text-[#29e0ca]"
                    : ""
                }`}
                size={20}
                onClick={() => handleSort("votes", "asc")}
              />
              <LiaSortAmountDownSolid
                className={`cursor-pointer ${
                  sortCriteria.field === "votes" &&
                  sortCriteria.direction === "desc"
                    ? "text-[#29e0ca]"
                    : ""
                }`}
                size={20}
                onClick={() => handleSort("votes", "desc")}
              />
            </div>
          </div>
        )}
        <div className="flex justify-between items-center hover:bg-[#224063] px-4 py-1">
          <p className="text-xl">Reset Sort</p>
          <div className="flex items-center gap-3">
            <MdRefresh
              className={`cursor-pointer ${
                sortCriteria.field === null ? "text-[#29e0ca]" : ""
              }`}
              size={20}
              onClick={handleResetSort}
            />
            <div className="w-[20px]" />
          </div>
        </div>
      </PopoverBody>
    </PopoverContent>
  </PopoverRoot>
);
