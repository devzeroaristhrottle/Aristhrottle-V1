"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useUser } from "@account-kit/react";
import { useEffect, useRef, useState } from "react";
import { CgCloseO, CgProfile } from "react-icons/cg";
import { FaUserPlus } from "react-icons/fa";
import { HiPlus } from "react-icons/hi";
import { MdEdit } from "react-icons/md";
import { toast } from "react-toastify";
import Loader from "./Loader";

// Add interests support to formData and UI
// 2. Use 'username' instead of 'new_username' in form submission
// 3. Improve image handling: allow preview, removal, and upload

// Add interests to UserProfile and EditProfileProps
interface InterestCategory {
  name: string;
  tags: string[];
}

interface UserProfile {
  username: string;
  bio: string;
  tags: string[];
  profile_pic: string;
  interests?: InterestCategory[];
}

interface EditProfileProps {
  onCancel: () => void;
  formData: {
    title: string;
    bio: string;
    tags: string[];
    file: File | null;
    interests: InterestCategory[];
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      tags: string[];
      file: File | null;
      bio: string;
      interests: InterestCategory[];
    }>
  >;
}

export default function EditProfile({
  onCancel,
  formData,
  setFormData,
}: EditProfileProps) {
  // const [dragActive, setDragActive] = useState(false);

  // const handleDrag = (e: React.DragEvent) => {
  //   console.log(dragActive);
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (e.type === "dragenter" || e.type === "dragover") {
  //     setDragActive(true);
  //   } else if (e.type === "dragleave") {
  //     setDragActive(false);
  //   }
  // };

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragActive(false);

  //   if (e.dataTransfer.files && e.dataTransfer.files[0]) {
  //     handleFile(e.dataTransfer.files[0]);
  //   }
  // };
  const user = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryTagInput, setCategoryTagInput] = useState("");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  // Improved image handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (
      file &&
      file.size <= 10 * 1024 * 1024 &&
      ["image/jpeg", "image/png"].includes(file.type)
    ) {
      setPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, file }));
    } else {
      toast.error("Please select a JPG or PNG file under 10MB");
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setFormData((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Interests logic
  const handleAddCategory = () => {
    if (
      categoryInput.trim() &&
      formData.interests.length < 5 &&
      !formData.interests.some((cat) => cat.name === categoryInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, { name: categoryInput.trim(), tags: [] }],
      }));
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
    setSelectedCategoryIndex(null);
  };

  const handleAddCategoryTag = () => {
    if (
      selectedCategoryIndex !== null &&
      categoryTagInput.trim() &&
      formData.interests[selectedCategoryIndex].tags.length < 10 &&
      !formData.interests[selectedCategoryIndex].tags.includes(categoryTagInput.trim())
    ) {
      setFormData((prev) => {
        const newInterests = [...prev.interests];
        newInterests[selectedCategoryIndex].tags.push(categoryTagInput.trim());
        return { ...prev, interests: newInterests };
      });
      setCategoryTagInput("");
    }
  };

  const handleRemoveCategoryTag = (catIdx: number, tagIdx: number) => {
    setFormData((prev) => {
      const newInterests = [...prev.interests];
      newInterests[catIdx].tags = newInterests[catIdx].tags.filter((_, i) => i !== tagIdx);
      return { ...prev, interests: newInterests };
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();
    if (formData?.file) {
      submitData.append("file", formData?.file);
    }
    if (formData?.bio) {
      submitData.append("bio", formData?.bio);
    }
    if (formData?.tags && formData.tags.length) {
      submitData.append("tags", JSON.stringify(formData.tags));
    }
    if (formData?.title) {
      submitData.append("username", formData?.title);
    }
    if (formData?.interests && formData.interests.length) {
      submitData.append("interests", JSON.stringify(formData.interests));
    }
    submitData.append("user_wallet_address", user?.address || "");
    
    onCancel();
    try {
      const response = await axiosInstance.put("/api/user", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        toast.success("Your profile has been updated successfully!");
      } else {
        toast.error("Failed to update profile. Try again.");
      }
    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  };

  const getProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        `/api/user?wallet=${user?.address}`
      );
      const userData: UserProfile = response?.data?.user;
      setFormData((prev) => ({
        ...prev,
        title: userData?.username || "",
        bio: userData?.bio || "",
        tags: userData?.tags || [],
        interests: userData?.interests || [],
      }));
      if (userData?.profile_pic && !formData.file) {
        setPreview(userData?.profile_pic);
      }
    } catch (error) {
      console.error("Error uploading profile data: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="relative bg-[#141e29] border border-white shadow-lg mx-6 rounded-md py-8 md:ml-20">
          <CgCloseO
            onClick={onCancel}
            className="absolute -top-5 -right-5 text-white w-5 h-5 cursor-pointer"
          />
          <form onSubmit={handleSubmit}>
            <div className="relative mx-10 md:mx-48">
              <div className="relative rounded border border-white flex justify-center items-center py-2 md:py-4">
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Profile preview"
                      className="w-36 h-36 md:w-44 md:h-44 object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <CgProfile className="w-36 h-36 md:w-44 md:h-44 text-white text-6xl" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-0 md:top-1 -right-5 md:-right-7"
              >
                <FaUserPlus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex justify-center items-center md:mx-48 mt-1 mb-4 md:my-6 gap-x-4">
              <input
                className={`text-[#29e0ca] text-lg md:text-3xl outline-none bg-transparent w-20 md:w-full ${
                  !isEditingUsername ? "cursor-default" : "border pl-2"
                }`}
                value={formData.title}
                readOnly={!isEditingUsername}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <MdEdit
                fill="#FFFFFF"
                className="cursor-pointer"
                onClick={() => setIsEditingUsername(true)}
              />
            </div>

            <div className="flex gap-2 text-2xl px-6 md:px-12">
              <span className="text-[#1783fb] text-lg md:text-3xl">Bio:</span>
              <textarea
                placeholder="Max 200 characters"
                className="w-full rounded px-2 text-white text-base border-2 border-[#1783fb] bg-gray-800 resize-none outline-none"
                rows={4}
                maxLength={200}
                value={formData?.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-2 text-2xl mt-4 px-6 md:px-12">
              <span className="text-[#1783fb] text-lg md:text-3xl">Tags:</span>
              <div className="flex flex-col w-full">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag (max 5)"
                    className="w-full rounded px-2 py-1 text-white text-base border-2 border-[#1783fb] bg-gray-800 outline-none"
                    maxLength={100}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-white"
                  >
                    <HiPlus size={20} />
                  </button>
                </div>
                <div className="flex gap-3 mt-3 flex-wrap">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 border-2 border-[#1783fb] rounded-lg cursor-pointer flex items-center gap-x-1 px-1 md:px-2"
                      onClick={() => handleRemoveTag(index)}
                    >
                      <p className="text-sm md:text-lg">{tag}</p>
                      <HiPlus className="w-3 h-3 md:w-5 md:h-5 rotate-45" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 text-2xl mt-4 px-6 md:px-12">
              <span className="text-[#1783fb] text-lg md:text-3xl">Interests:</span>
              <div className="flex flex-col w-full">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add category (max 5)"
                    className="w-full rounded px-2 py-1 text-white text-base border-2 border-[#1783fb] bg-gray-800 outline-none"
                    maxLength={100}
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                  />
                  <button type="button" onClick={handleAddCategory} className="text-white">
                    <HiPlus size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {formData.interests.map((cat, catIdx) => (
                    <div key={catIdx} className="bg-gray-800 border-2 border-[#1783fb] rounded-lg p-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{cat.name}</span>
                        <button type="button" onClick={() => handleRemoveCategory(catIdx)}>
                          <HiPlus className="w-3 h-3 md:w-5 md:h-5 rotate-45" />
                        </button>
                        <button type="button" onClick={() => setSelectedCategoryIndex(catIdx)} className="text-xs text-blue-400 underline ml-2">
                          Edit Tags
                        </button>
                      </div>
                      {selectedCategoryIndex === catIdx && (
                        <div className="mt-2">
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Add tag (max 10)"
                              className="w-full rounded px-2 py-1 text-white text-base border-2 border-[#1783fb] bg-gray-800 outline-none"
                              maxLength={100}
                              value={categoryTagInput}
                              onChange={(e) => setCategoryTagInput(e.target.value)}
                            />
                            <button type="button" onClick={handleAddCategoryTag} className="text-white">
                              <HiPlus size={20} />
                            </button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {cat.tags.map((tag, tagIdx) => (
                              <div key={tagIdx} className="bg-gray-700 border border-[#1783fb] rounded px-2 py-1 flex items-center gap-1">
                                <span className="text-white text-sm">{tag}</span>
                                <button type="button" onClick={() => handleRemoveCategoryTag(catIdx, tagIdx)}>
                                  <HiPlus className="w-3 h-3 rotate-45" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-x-5 md:gap-x-10 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-red-500 font-semibold rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-black font-semibold rounded-full bg-[#29e0ca] hover:text-white hover:bg-transparent hover:border hover:border-white transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
