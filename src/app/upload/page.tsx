"use client";

import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useAuthModal, useUser } from "@account-kit/react";
import { Context } from "@/context/contextProvider";
import UploadComponent from "./uplodecomponent"; // Adjust path as needed
import { type Meme } from "../home/page"; // Adjust path as needed

export default function UploadPage() {
  const { userDetails, setUserDetails } = useContext(Context);
  const [isUploading, setIsUploading] = useState(false);
  const { openAuthModal } = useAuthModal();
  const user = useUser();

  // Handle successful upload - you can customize this based on your needs
  const handleUploadSuccess = (meme: Meme) => {
    console.log("Meme uploaded successfully:", meme);
    // toast.success("Content uploaded successfully!");

    // Update user stats if needed
    if (userDetails) {
      setUserDetails({
        ...userDetails,
        uploads: userDetails.uploads + 1,
      });
    }

    // You can add navigation logic here if needed
    // Example: router.push('/dashboard') or router.push('/')
  };

  // Handle upload failure/revert
  const handleUploadRevert = (meme: Meme) => {
    console.log("Upload failed, reverting:", meme);
    toast.error("Upload failed, please try again");

    // Revert user stats if they were optimistically updated
    if (userDetails) {
      setUserDetails({
        ...userDetails,
        uploads: Math.max(0, userDetails.uploads - 1),
      });
    }
  };

  // // Check if user is authenticated
  // if (!user || !user.address) {
  // 	return (
  // 		<div className="mx-8 md:ml-24 xl:mx-auto md:max-w-[56.25rem] lg:max-w-[87.5rem]">
  // 			<div className="text-center">
  // 				<h1 className="text-2xl font-bold text-white mb-4">
  // 					Authentication Required
  // 				</h1>
  // 				<p className="text-gray-400 mb-6">
  // 					Please connect your wallet to upload content
  // 				</p>
  // 				<button
  // 					onClick={() => openAuthModal && openAuthModal()}
  // 					className="bg-[#28e0ca] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#20c4aa] transition-colors"
  // 				>
  // 					Connect Wallet
  // 				</button>
  // 			</div>
  // 		</div>
  // 	)
  // }

  return (
    <div className="mx-2 md:ml-24 xl:mx-auto md:max-w-[56.25rem] lg:max-w-[87.5rem]">
      {/* Upload Component */}
      <div className="max-w-1xl mx-auto px-2 py-2">
        <UploadComponent
          onUpload={handleUploadSuccess}
          onRevert={handleUploadRevert}
          setIsUploading={setIsUploading}
        />
      </div>

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Uploading your content...</p>
            <p className="text-gray-400 text-sm mt-1">
              Please don t close this page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
