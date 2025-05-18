"use client";

import { Tag } from "@/components/ui/tag";
import { useRef, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaUserPlus } from "react-icons/fa";
import { HiPlus } from "react-icons/hi";
import { MdEdit } from "react-icons/md";

interface EditProfileProps {
  onCancel: () => void;
  formData: {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

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
      alert("Please select a JPG or PNG file under 10MB");
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

    if (!formData.file) {
      alert("Please select a file");
      return;
    }

    if (!formData.bio.trim()) {
      alert("Please enter a bio");
      return;
    }

    const submitData = new FormData();
    submitData.append("file", formData.file);
    submitData.append("bio", formData.bio);
    submitData.append("tags", JSON.stringify(formData.tags));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        alert("Upload successful!");
        onCancel();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      alert("Error uploading file: " + error);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center">
      <div className="bg-[#141e29] border border-white shadow-lg mx-4 md:w-1/3 rounded-md md:mx-auto py-8">
        <form onSubmit={handleSubmit}>
          <div className="relative mx-10 md:mx-36">
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

          <div className="flex justify-center items-center  md:mx-48 mt-1 mb-4 md:my-6">
            <input
              className="text-[#29e0ca] text-lg md:text-3xl outline-none bg-transparent w-20 md:w-full"
              value={"Username"}
              readOnly
            />
            <MdEdit fill="#FFFFFF" />
          </div>

          <div className="flex gap-2 text-2xl px-6 md:px-12">
            <span className="text-[#1783fb] text-lg md:text-3xl">Bio:</span>
            <textarea
              placeholder="Max 200 characters"
              className="w-full rounded px-2 text-white text-base border-2 border-[#1783fb] bg-gray-800 resize-none outline-none"
              rows={4}
              maxLength={200}
              value={formData.bio}
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
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
