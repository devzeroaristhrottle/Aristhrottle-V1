

import React, { useState, useRef, useContext, useEffect } from "react";
import { HiSparkles } from "react-icons/hi2";
import { IoCloudUploadOutline, IoSaveOutline } from "react-icons/io5";
import axiosInstance from "@/utils/axiosInstance";
import { Context } from "@/context/contextProvider";
import { useAuthModal, useUser } from "@account-kit/react";
import { type Meme } from "../home/page";
import { toast } from "react-toastify";
import { getTimeUntilReset } from "@/utils/dateUtils";
import axios from "axios";

interface Tags {
  name: string;
  _id?: string;
}

interface UploadCompProps {
  onUpload(meme: Meme): void;
  onRevert(meme: Meme): void;
  setIsUploading: (isUploading: boolean) => void;
}

const UploadComponent: React.FC<UploadCompProps> = ({
  onUpload,
  onRevert,
  setIsUploading,
}) => {
  const { setUserDetails, userDetails } = useContext(Context);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tags[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tags[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLocalUploading, setIsLocalUploading] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openAuthModal } = useAuthModal();
  const user = useUser();
  const titleRef = useRef<HTMLInputElement>(null);

  // Check for generation reset when component loads
  useEffect(() => {
    if (user && user.address && userDetails) {
      checkGenerationReset();
    }
  }, [user, userDetails]);

  const checkGenerationReset = async () => {
    try {
      const response = await axiosInstance.get("/api/user/check-generations");
      if (response.data.wasReset && userDetails) {
        // Update local user state if generations were reset
        setUserDetails({
          ...userDetails,
          generations: 0,
        });
        toast.info("Your daily generation limit has been reset!");
      }
    } catch (error) {
      console.error("Error checking generation reset:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      findTag();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [newTagInput]);

  const findTag = async () => {
    if (newTagInput.length > 0) {
      const response = await axiosInstance.get(`/api/tags?name=${newTagInput}`);

      if (response.data.tags) {
        setFilteredTags([...response.data.tags]);
      }
    } else {
      setFilteredTags([]);
    }
  };

  const handleTagSelect = (tag: string, isNew: boolean, id: string) => {
    if (selectedTags.length >= 5) return;

    if (!selectedTags.some((t) => t.name === tag)) {
      setSelectedTags((prev) => [...prev, { name: tag, isNew: isNew, id: id }]);
    }
  };

  const handleNewTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();

      // Check if max tags reached
      if (selectedTags.length >= 5) {
        toast.error("Maximum 5 tags allowed");
        return;
      }

      // Check if the exact tag already exists in selected tags
      if (!selectedTags.some((tag) => tag.name === newTagInput.trim())) {
        // Check if the exact tag exists in filtered tags
        const existingTag = filteredTags.find(
          (tag) => tag.name === newTagInput.trim()
        );
        if (existingTag) {
          // If it exists in filtered tags, use that
          handleTagSelect(existingTag.name, false, existingTag._id || "");
        } else {
          // If it doesn't exist, create new tag
          setSelectedTags((prev) => [
            ...prev,
            { name: newTagInput.trim(), isNew: true, _id: undefined },
          ]);
        }
      } else {
        toast.error("Tag already added");
      }

      // Clear input and dropdown
      setNewTagInput("");
      setFilteredTags([]);
    }
  };

  const removeTag = (tagTitle: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.name !== tagTitle));
  };

  const getImage = async () => {
    if (!user || !user.address) {
      if (openAuthModal) {
        openAuthModal();
      }
      return;
    }
    if (!title || selectedTags.length < 1) {
      toast.error("Please add a title and atleast a tag to continue");
      titleRef.current?.focus();
      return;
    }
    try {
      setIsGenerating(true);
      if (userDetails) {
        if (userDetails.generations >= 5) {
          toast.error(
            "You have reached your daily generation limit of 5 images! Limit resets daily."
          );
          setIsGenerating(false);
          return;
        }
        setUserDetails({
          ...userDetails,
          generations: userDetails.generations + 1,
        });
      }
      const tagNames = selectedTags.map((tag) => tag.name);

      // Use our backend API as a proxy instead of directly calling the external service
      const response = await axiosInstance.post(
        "/api/generate-image",
        {
          title,
          tags: tagNames,
        },
        {
          responseType: "blob", // Important for handling binary data
          timeout: 180000, // 3 minute timeout (longer than backend to account for network)
        }
      );

      // Create blob URL from the response
      const imageBlob = new Blob([response.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      if (userDetails) {
        // Revert the optimistic update
        setUserDetails({
          ...userDetails,
          generations: Math.max(0, userDetails.generations),
        });
      }

      // Show appropriate error message
      const err = error as any; // Type assertion to handle error properties
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        toast.error(
          "The image generation timed out. Please try again with a simpler prompt."
        );
      } else if (err.response?.status === 403) {
        toast.error("Daily generation limit reached.");
      } else {
        toast.error(
          "Error generating Content: Please change title and tags and try again!"
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = () => {
    if (!userDetails) {
      openAuthModal();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileUrl = URL.createObjectURL(file);
      setGeneratedImage(fileUrl);
    }
  };

  const handleUploadMeme = (generatedImage: string) => {
    const newMeme: Meme = {
      _id: `temp-${Date.now()}`,
      name: title,
      image_url: generatedImage,
      vote_count: 0,
      tags: selectedTags.map((tag) => ({
        _id: "",
        name: tag.name,
        count: 0,
        type: "Event" as const,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        created_by: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      })),
      categories: [],
      created_by: {
        ...userDetails!,
        updatedAt: new Date().toISOString(),
        __v: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shares: [],
      bookmarks: [],
      is_onchain: false,
      __v: 0,
      voted: false,
      has_user_voted: false,
    };

    onUpload(newMeme);
    return newMeme;
  };

  const handleUpload = async () => {
    if (!user || !user.address) {
      if (openAuthModal) {
        openAuthModal();
      }
      return;
    }
    console.log(selectedTags);
    if (generatedImage) {
      if (selectedTags.length < 1) {
        toast.error("Please enter atleast one tag");
        return;
      }
      // Show meme immediately (optimistic update)
      const optimisticMeme = handleUploadMeme(generatedImage);

      try {
        setIsLocalUploading(true);
        setIsUploading(true);

        const response = await fetch(generatedImage);
        const blob = await response.blob();

        // Create FormData for meme upload
        const formData = new FormData();
        const reqTag = selectedTags.map((tag) => tag.name);
        formData.append("name", title);
        formData.append("file", blob, "image.png");
        formData.append("created_by", userDetails!._id);

        formData.append("tags", JSON.stringify(reqTag));

        const uploadResponse = await axiosInstance.post("/api/meme", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 180000,
        });

        if (uploadResponse.status === 201) {
          console.log("Content uploaded successfully:", uploadResponse.data);

          // Reset form after successful upload
          setTitle("");
          setSelectedTags([]);
          setGeneratedImage(null);

          toast.success("Content uploaded successfully!");
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Error uploading meme:", error);

        // Provide more specific error messages based on error type
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            toast.error(
              "Upload timed out. Please try with a smaller image or check your connection."
            );
          } else if (error.response) {
            // Server responded with an error status
            const errorMessage =
              error.response.data?.message || "Failed to upload Content";
            toast.error(`Upload failed: ${errorMessage}`);
          } else if (error.request) {
            // Request was made but no response received
            toast.error(
              "No response from server. Please check your connection and try again."
            );
          } else {
            toast.error("Failed to upload Content. Please try again.");
          }
        } else {
          toast.error("Failed to upload Content. Please try again.");
        }

        onRevert(optimisticMeme);
      } finally {
        setIsLocalUploading(false);
        setIsUploading(false);
      }
    }
  };

  // Add function to save to drafts
  const handleSaveToDrafts = async () => {
    if (!user || !user.address) {
      if (openAuthModal) {
        openAuthModal();
      }
      return;
    }

    if (!generatedImage) {
      toast.error("No image to save");
      return;
    }

    if (!title) {
      toast.error("Please add a title");
      titleRef.current?.focus();
      return;
    }

    if (selectedTags.length < 1) {
      toast.error("Please enter at least one tag");
      return;
    }

    try {
      setIsSavingDraft(true);

      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Create FormData for draft meme
      const formData = new FormData();
      const reqTag = selectedTags.map((tag) => tag.name);
      formData.append("name", title);
      formData.append("file", blob, "image.png");
      formData.append("tags", JSON.stringify(reqTag));

      const draftResponse = await axiosInstance.post(
        "/api/draft-meme",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 180000,
        }
      );

      if (draftResponse.status === 201 || draftResponse.status === 200) {
        toast.success("Saved to drafts successfully!");

        // Optional: Reset form after saving to drafts
        // setTitle('')
        // setSelectedTags([])
        // setGeneratedImage(null)
      } else {
        throw new Error("Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          toast.error(
            "Save timed out. Please try with a smaller image or check your connection."
          );
        } else if (error.response) {
          const errorMessage =
            error.response.data?.message || "Failed to save draft";
          toast.error(`Save failed: ${errorMessage}`);
        } else if (error.request) {
          toast.error(
            "No response from server. Please check your connection and try again."
          );
        } else {
          toast.error("Failed to save draft. Please try again.");
        }
      } else {
        toast.error("Failed to save draft. Please try again.");
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="flex justify-center items-start gap-2 lg:gap-8 w-full py-1 lg:py-8 flex-col lg:flex-row h-fit px-0 lg:px-0">
      {/* Left Section - Instructions or Image */}
      <div className="w-full max-w-md lg:w-[369px] lg:h-[369px] flex-shrink-0 mx-auto lg:mx-0">
        {isGenerating ? (
          <div
            className="flex flex-col justify-center items-center border rounded-xl p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300 h-full w-full"
            style={{
              borderRadius: "10px",
              borderWidth: "1px",
              borderColor: "#60A5FA",
            }}
          >
            <div className="w-20 h-20 lg:w-32 lg:h-32 border-8 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="mt-4 text-center">
              <p className="text-blue-400 font-medium text-sm lg:text-base">
                Generating your content...
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Please don&apos;t refresh the page.
              </p>
            </div>
          </div>
        ) : generatedImage ? (
          /* Image Display */
          <div
            className="h-full w-full flex flex-col items-center justify-center"
            onClick={handleFileSelect}
            title="Click to select a different image"
          >
            <div
              className="w-full h-full border rounded-xl p-3 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300"
              style={{
                borderRadius: "10px",
                borderWidth: "1px",
                borderColor: "#60A5FA",
              }}
            >
              <img
                src={generatedImage}
                alt="Generated content"
                className="w-full h-full object-contain rounded hover:opacity-90 transition-opacity duration-200"
                style={{ borderRadius: "6px" }}
              />
            </div>

            <p className="text-sm text-gray-400 mt-2 text-center lg:absolute lg:-bottom-8">
              Click to select a different image
            </p>
          </div>
        ) : (
          /* Upload Instructions */
          <div
            className="border h-full w-full flex flex-col justify-between text-gray-400 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20 cursor-pointer p-4 lg:p-6"
            style={{
              borderRadius: "10px",
              borderWidth: "1px",
              borderColor: "#2FCAC7",
            }}
          >
            {/* AI Instructions */}
            <div
              className="flex justify-center items-center flex-1"
              onClick={getImage}
            >
              <div className="flex flex-col items-center text-center">
                <HiSparkles
                  size={40}
                  className="text-[hsla(173,75%,52%,1)] hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 mb-3"
                />
                <div className="text-[hsla(173,75%,52%,1)] text-lg lg:text-xl hover:text-white transition-colors duration-200 font-medium mb-2">
                  Create with Aris Intelligence
                </div>
                <div className="text-sm lg:text-base text-gray-300">
                  Enter Title and Tags to Create
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full gap-3 my-4">
              <div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
              <span className="px-3 text-sm font-medium hover:text-blue-400 transition-colors duration-200">
                or
              </span>
              <div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
            </div>

            {/* manual upload */}
            <div
              className="flex justify-center items-center flex-1"
              onClick={handleFileSelect}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex justify-center items-center mb-3">
                  <IoCloudUploadOutline
                    size={40}
                    className="text-[hsla(173,75%,52%,1)] hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0"
                  />
                </div>
                <div className="text-[hsla(173,75%,52%,1)] text-lg lg:text-xl hover:text-white transition-colors duration-200 font-medium mb-2">
                  Choose File
                </div>
                <div className="text-sm lg:text-base text-gray-300">
                  JPG, PNG / Max. 10 MB
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Form */}
      <div className="flex flex-col justify-between w-full max-w-4xl lg:flex-1 py-1 h-fit gap-y-4">
        {/* Title Section */}
        <div className="flex flex-col group">
          <label className="text-lg lg:text-xl mb-1 group-hover:text-blue-400 transition-colors duration-200 font-medium">
            title
          </label>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Max 100 Characters"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                maxLength={100}
                className="bg-transparent border rounded-xl px-4 py-4 text-base lg:text-lg text-white placeholder:text-gray-400 focus:outline-none border-[#2FCAC7] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 transition-all duration-200 w-full pr-16 min-h-[60px] lg:min-h-[80px]"
                style={{ borderRadius: "10px", borderWidth: "1px" }}
                ref={titleRef}
              />
              {/* Character counter inside input */}
              <div className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none">
                {title.length}/100
              </div>
            </div>
          </div>
        </div>

       {/* Tags Section */}
				<div className="flex flex-col group">
					<label className="text-lg lg:text-xl mb-2 group-hover:text-blue-400 transition-colors duration-200 font-medium">
						tags
					</label>

					{/* Tags input container with tags inside */}
					<div className="relative w-full" ref={dropdownRef}>
						<div className="bg-transparent border rounded-xl px-4 py-3 text-base lg:text-lg text-white border-[#2FCAC7] hover:border-blue-300 focus-within:border-blue-300 focus-within:shadow-lg focus-within:shadow-blue-400/20 transition-all duration-200 w-full min-h-[60px] lg:min-h-[80px] flex flex-wrap items-center gap-2 relative" style={{ borderRadius: '10px', borderWidth: '1px' }}>
							
							{/* Selected Tags inside input */}
							{selectedTags.map((tag, index) => (
								<span
									key={index}
									className="bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm whitespace-nowrap"
								>
									{tag.name}
									<button
										onClick={() => removeTag(tag.name)}
										className="text-gray-400 hover:text-red-400 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-600 transition-colors text-lg leading-none"
									>
										×
									</button>
								</span>
							))}
							
							{/* Input field */}
							<input 
								type="text" 
								value={newTagInput} 
								onChange={e => setNewTagInput(e.target.value)} 
								onKeyDown={handleNewTag} 
								placeholder={selectedTags.length >= 5 ? "Maximum 5 tags reached" : "Enter Max 5 Tag"} 
								className="bg-transparent outline-none text-white placeholder:text-gray-400 flex-1 min-w-[150px] py-1 pr-12 text-base" 
								disabled={selectedTags.length >= 5} 
							/>
							
							{/* Tag counter and instruction */}
							<div className="absolute bottom-2 right-3 text-xs text-gray-400 pointer-events-none">
								<div className="text-right">
									<div>Press Enter/Return to add tag • {selectedTags.length}/5</div>
								</div>
							</div>
						</div>

						{/* Dropdown suggestions - Horizontal */}
						{filteredTags && newTagInput.length > 0 && (
							<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-blue-400 rounded-2xl shadow-lg p-3" style={{ borderRadius: '16px' }}>
								{filteredTags.length > 0 ? (
									<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
										{filteredTags.map((tag, index) => (
											<div
												key={index}
												className="bg-gray-600 hover:bg-blue-600 cursor-pointer text-white text-sm px-3 py-2 rounded-2xl transition-colors duration-200 whitespace-nowrap"
												onClick={() => {
													if (tag._id) {
														handleTagSelect(tag.name, false, tag._id)
														setNewTagInput('')
													}
												}}
											>
												{tag.name}
											</div>
										))}
									</div>
								) : (
									<div className="px-3 py-2 text-gray-400 text-sm text-center">
										No suggestions found
									</div>
								)}
							</div>
						)}
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-row justify-center gap-4 w-full text-lg mt-6">
          <button
            onClick={getImage}
            disabled={isGenerating || isLocalUploading || isSavingDraft}
            className="rounded-xl border text-[#28e0ca] px-6 py-3 flex-1 max-w-xs flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderRadius: "10px",
              borderWidth: "1px",
              borderColor: "#28e0ca",
            }}
          >
            {isGenerating ? "Creating..." : "Create"}
            <HiSparkles
              size={20}
              className="text-[hsla(173,75%,52%,1)]  hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 mb-1"
            />
          </button>

          <button
            onClick={handleUpload}
            disabled={isLocalUploading || isSavingDraft || !generatedImage}
            className="rounded-xl bg-[#28e0ca] px-6 py-3 flex-1 max-w-xs text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "10px" }}
          >
            {isLocalUploading ? "Posting..." : "Post"}
          </button>
        </div>

        {/* Save to Drafts button - only visible when there's a generated image */}
        {generatedImage && (
          <button
            onClick={handleSaveToDrafts}
            disabled={isLocalUploading || isSavingDraft}
            className="rounded-xl border text-[#28e0ca] px-6 py-3 w-full max-w-md mx-auto flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            style={{
              borderRadius: "10px",
              borderWidth: "1px",
              borderColor: "#28e0ca",
            }}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
            <IoSaveOutline className="group-hover:scale-110 transition-transform duration-200" />
          </button>
        )}

        {/* Generation limit indicator */}
        {userDetails && (
          <div className="text-center text-sm text-gray-400 mt-6">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (userDetails.generations || 0)
                      ? "bg-blue-500"
                      : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1">
              <span className="font-medium">
                {Math.max(0, 5 - (userDetails.generations || 0))} of 5
              </span>{" "}
              daily generations remaining
              {userDetails.generations >= 5 && (
                <span> • Resets in ~{getTimeUntilReset()}</span>
              )}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default UploadComponent;


