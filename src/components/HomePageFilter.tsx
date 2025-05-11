import React, { useEffect, useState } from "react";
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { HiAdjustmentsHorizontal, HiPlus } from "react-icons/hi2";
import { Field, Input } from "@chakra-ui/react";
import { Tag } from "./ui/tag";
import { TagI } from "@/app/home/page";
import { IoIosClose } from "react-icons/io";
import axiosInstance from "@/utils/axiosInstance";

type Props = {
  popularTags: TagI[];
  popularCategory: TagI[];
};

interface Tags {
  name: string;
  isNew?: boolean;
  id?: string;
}

export default function HomePageFilter({
  popularTags,
  popularCategory,
}: Props) {
  const [queryCategory, setQueryCategory] = useState("");
  const [queryTag, setQueryTag] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tags[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<Tags[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      findTag();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [queryTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      findCategory();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [queryCategory]);

  const findCategory = async () => {
    if (queryCategory.length > 0) {
      const response = await axiosInstance.get(`/api/categories?name=${queryCategory}`);

      if (response.data.categories) {
        setFilteredCategory([...response.data.categories]);
      }
    } else {
      setFilteredCategory([]);
    }
  };

  const findTag = async () => {
    if (queryTag.length > 0) {
      const response = await axiosInstance.get(`/api/tags?name=${queryTag}`);

      if (response.data.tags) {
        setFilteredTags([...response.data.tags]);
      }
    } else {
      setFilteredTags([]);
    }
  };

  const removeTag = (tagTitle: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagTitle));
  };

  const handleTagSelect = (tag: string) => {
    if (selectedTags.length >= 5) return;

    if (!selectedTags.some((t) => t === tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const removeCategory = (catTitle: string) => {
    setSelectedCategory((prev) => prev.filter((cat) => cat !== catTitle));
  };

  const handleCategorySelect = (cat: string) => {
    if (selectedCategory.length >= 3) return;

    if (!selectedCategory.some((t) => t === cat)) {
      setSelectedCategory((prev) => [...prev, cat]);
    }
  };

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border border-[#1783fb] px-3 rounded-full text-[#1783fb] text-lg hover:scale-105"
        >
          <HiAdjustmentsHorizontal />
          <span>filter</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-[#141e29] left-52 bottom-0 w-[570px]">
        {/* <PopoverArrow className="!bg-slate-700 " /> */}
        <PopoverBody className="bg-[#141e29] border-2 border-[#1783fb] rounded-md p-0">
          <div className="p-6 rounded-lg bg-[#010b1a] border border-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.3)]">
            <div className="flex flex-col gap-4 ">
              <div className="flex gap-2">
                <div className="w-full relative">
                  <Field.Root>
                    <Field.Label className="text-[#1783fb] text-2xl">
                      Categories:
                    </Field.Label>
                    <Input
                      type="text"
                      value={queryCategory}
                      onChange={(e) => setQueryCategory(e.target.value)}
                      //   onKeyDown={handleNewTag}
                      placeholder="Max 3 categories"
                      className="w-full rounded outline-none px-2 py-1 text-white text-base border-2 border-[#1783fb] bg-gray-800"
                      disabled={selectedTags.length >= 5}
                    />
                  </Field.Root>

                  {filteredCategory && queryCategory.length > 0 && (
                    <div className="absolute w-full z-10  bg-[#081533] border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto mt-2 p-4 space-x-3">
                      {filteredCategory.map((cat, index) => (
                        <Tag
                          key={index}
                          className="bg-blue-500 rounded-lg cursor-pointer text-balance py-1 px-2"
                          size="lg"
                          onClick={() => {
                            handleCategorySelect(cat.name);
                            setQueryCategory("");
                          }}
                        >
                          {cat.name}
                        </Tag>
                      ))}
                      {queryCategory.length === 0 && (
                        <div className="px-4 py-2 text-gray-400">
                          No recommendations found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-4">
                {selectedCategory.map((cat, index) => (
                  <Tag
                    key={index}
                    className="bg-blue-500 rounded-lg cursor-pointer text-balance py-1"
                    endElement={
                      <IoIosClose onClick={() => removeCategory(cat)} />
                    }
                    size="lg"
                  >
                    {cat}
                  </Tag>
                ))}
              </div>

              {/* Sample Tags */}
              <div className="flex flex-wrap gap-4">
                {popularCategory.map((cat, index) => (
                  <Tag
                    key={index}
                    className={`bg-gray-800 border-2 border-[#1783fb] hover:opacity-50 rounded-lg cursor-pointer py-1`}
                    onClick={() => {
                      handleCategorySelect(cat.name);
                    }}
                    endElement={<HiPlus />}
                    size="lg"
                  >
                    {cat.name}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-5">
              <div className="flex gap-2">
                <div className="w-full relative">
                  <Field.Root>
                    <Field.Label className="text-[#1783fb] text-2xl">
                      Tags:
                    </Field.Label>
                    <Input
                      type="text"
                      value={queryTag}
                      onChange={(e) => setQueryTag(e.target.value)}
                      //   onKeyDown={handleNewTag}
                      placeholder="Max 5 tags"
                      className="w-full rounded outline-none px-2 py-1 text-white text-base border-2 border-[#1783fb] bg-gray-800"
                      disabled={selectedTags.length >= 5}
                    />
                  </Field.Root>

                  {filteredTags && queryTag.length > 0 && (
                    <div className="absolute w-full z-10  bg-[#081533] border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto mt-2 p-4 space-x-3">
                      {filteredTags.map((tag, index) => (
                        <Tag
                          key={index}
                          className="bg-blue-500 rounded-lg cursor-pointer text-balance py-1 px-2"
                          size="lg"
                          onClick={() => {
                            handleTagSelect(tag.name);
                            setQueryTag("");
                          }}
                        >
                          {tag.name}
                        </Tag>
                      ))}
                      {filteredTags.length === 0 && (
                        <div className="px-4 py-2 text-gray-400">
                          No recommendations found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-4">
                {selectedTags.map((tag, index) => (
                  <Tag
                    key={index}
                    className="bg-blue-500 rounded-lg cursor-pointer text-balance py-1"
                    endElement={<IoIosClose onClick={() => removeTag(tag)} />}
                    size="lg"
                  >
                    {tag}
                  </Tag>
                ))}
              </div>

              {/* Sample Tags */}
              <div className="flex flex-wrap gap-4">
                {popularTags.map((tag, index) => (
                  <Tag
                    key={index}
                    className={`bg-gray-800 border-2 border-[#1783fb] hover:opacity-50 rounded-lg cursor-pointer py-1`}
                    onClick={() => {
                      //   if (tag.id) {
                      //     // handleTagSelect(tag.name, false, tag.id);
                      //   }

                      handleTagSelect(tag.name);
                    }}
                    endElement={<HiPlus />}
                    size="lg"
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setSelectedCategory([]);
                  setSelectedTags([]);
                }}
                className="px-3 text-red-500 font-semibold rounded-full border border-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                clear
              </Button>
              <Button
                type="submit"
                // onClick={handleUpload}
                className="px-5 text-black font-semibold rounded-full bg-[#29e0ca] hover:text-white hover:bg-transparent hover:border hover:border-white transition-colors"
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}
