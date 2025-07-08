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

interface UserProfile {
  username: string;
  bio: string;
  tags: string[];
  profile_pic: string;
}

interface EditProfileProps {
  onCancel: () => void;
  formData: {
    title: string;
    bio: string;
    tags: string[];
    file: File | null;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      tags: string[];
      file: File | null;
      bio: string;
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
      submitData.append("new_username", formData?.title);
    }

    submitData.append("user_wallet_address", user?.address || "");

    try {
      const response = await axiosInstance.put("/api/user", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        toast.success("Your profile has been updated successfully!");
        onCancel();
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
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="w-36 h-36 md:w-44 md:h-44 object-cover rounded-full"
                  />
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
