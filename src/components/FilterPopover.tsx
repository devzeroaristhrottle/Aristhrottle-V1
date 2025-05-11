import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Input } from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/input-group";
import PercentageSlider from "@/components/PercentageSlider";
import { HiMinus, HiPlus } from "react-icons/hi";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";

interface FilterPopoverProps {
  activeTab: string;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  percentage: number;
  setPercentage: (value: number) => void;
  selectedTags: string[];
  tagInput: string;
  dateRange: { startDate: Date | null; endDate: Date | null };
  setDateRange: (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  filteredTags: string[];
  handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagClick: (tag: string) => void;
  handleTagRemove: (tag: string) => void;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  activeTab,
  filterOpen,
  setFilterOpen,
  percentage,
  setPercentage,
  selectedTags,
  tagInput,
  dateRange,
  setDateRange,
  filteredTags,
  handleTagInputChange,
  handleTagClick,
  handleTagRemove,
  resetFilters,
  applyFilters,
}) => (
  <PopoverRoot
    open={filterOpen}
    onOpenChange={() => setFilterOpen(!filterOpen)}
  >
    <PopoverTrigger asChild>
      <Button
        size={{ base: "2xs", md: "sm" }}
        variant="outline"
        className="flex gap-x-1 md:gap-x-2 border border-[#1783fb] px-1.5 md:px-3 rounded-full text-[#1783fb] text-lg md:text-xl hover:scale-105"
      >
        <HiAdjustmentsHorizontal />
        <span>filter</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="bg-[#141e29] md:left-36 top-1 md:-top-1 w-72 md:w-[570px]">
      <PopoverBody className="bg-[#141e29] border-2 border-[#1783fb] rounded-lg p-0">
        <div className="p-4 md:p-6 rounded-lg bg-[#010b1a] border border-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.3)]">
          <div className="flex items-center gap-2 mb-4">
            <label className="text-[#1783fb] text-lg md:text-2xl">Tags:</label>
            <div className="w-full">
              <InputGroup className="w-full">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  placeholder="Search tags (e.g., funny, meme, cricket)"
                  className="w-full rounded outline-none px-2 md:px-3 text-white md:text-lg border-2 border-[#1783fb] bg-gray-800"
                />
              </InputGroup>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-4 md:mb-6 max-h-28 md:max-h-36 overflow-y-auto">
            {filteredTags.map((tag, index) => (
              <Tag
                key={index}
                className={`bg-gray-800 border-2 flex items-center px-2 py-1 ${
                  selectedTags.includes(tag)
                    ? "border-[#29e0ca]"
                    : "border-[#1783fb]"
                } hover:opacity-50 rounded-lg cursor-pointer`}
                onClick={() => handleTagClick(tag)}
                endElement={
                  selectedTags.includes(tag) ? (
                    <HiMinus
                      className="cursor-pointer text-[#29e0ca] w-3 h-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagRemove(tag);
                      }}
                    />
                  ) : (
                    <HiPlus className="w-3 h-3" />
                  )
                }
              >
                {tag}
              </Tag>
            ))}
          </div>
          {!activeTab.includes("live") && (
            <PercentageSlider value={percentage} onChange={setPercentage} />
          )}
          {activeTab.includes("all") && (
            <div className="mb-6">
              <label className="text-[#1783fb] text-lg md:text-2xl block mb-2">
                Date Range:
              </label>
              <div className="flex gap-4">
                <DatePicker
                  selected={dateRange.startDate}
                  onChange={(date: any) =>
                    setDateRange({ ...dateRange, startDate: date })
                  }
                  selectsStart
                  startDate={dateRange.startDate || undefined}
                  endDate={dateRange.endDate || undefined}
                  placeholderText="Start Date"
                  className="w-full p-2 rounded border-2 border-[#1783fb] bg-gray-800 text-white"
                />
                <DatePicker
                  selected={dateRange.endDate}
                  onChange={(date: any) =>
                    setDateRange({ ...dateRange, endDate: date })
                  }
                  selectsEnd
                  startDate={dateRange.startDate || undefined}
                  endDate={dateRange.endDate || undefined}
                  minDate={dateRange.startDate || undefined}
                  placeholderText="End Date"
                  className="w-full p-2 rounded border-2 border-[#1783fb] bg-gray-800 text-white"
                />
              </div>
            </div>
          )}
          <div className="flex justify-center gap-6">
            <Button
              type="button"
              onClick={resetFilters}
              className="px-3 text-red-500 font-semibold rounded-full border border-red-500 hover:bg-red-500 hover:text-white transition-colors"
            >
              Reset
            </Button>
            <Button
              type="submit"
              onClick={applyFilters}
              className="px-3 text-black font-semibold rounded-full bg-[#29e0ca] hover:text-white hover:bg-transparent hover:border hover:border-white transition-colors"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverBody>
    </PopoverContent>
  </PopoverRoot>
);
