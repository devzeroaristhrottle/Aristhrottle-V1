"use client";

import React, { useState } from "react";
import Votes from "./components/Votes";
import Uploads from "./components/Uploads";
import Referrals from "./components/Referrals";

interface TabButtonProps {
  label: string;
  isActive: boolean;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("vote");
  // const [timelyActiveTab, setTimelyActiveTab] = useState("daily");

  const TabButton = ({ label, isActive }: TabButtonProps) => (
    <button
      onClick={() => setActiveTab(label.toLowerCase())}
      className={`text-sm sm:text-xl md:text-4xl font-medium py-2 md:py-1 flex-1 sm:w-28 md:w-40 rounded-md transition-all duration-300 ${
        isActive ? "bg-white text-black" : "bg-[#0d3159] text-white"
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "vote":
        return <Votes />;
      case "upload":
        return <Uploads />;
      case "referral":
        return <Referrals />;
      default:
        return <Votes />;
    }
  };

  return (
    <div className="md:max-w-7xl mx-auto px-2 sm:px-4 md:px-16 py-1 md:py-3">
      <div className="flex justify-between gap-2 sm:gap-4 md:gap-[2rem] border border-white rounded-10px md:max-w-5xl mx-1 sm:mx-2 md:mx-auto mb-2 md:mb-7 p-1 md:p-2">
        <TabButton label="Vote" isActive={activeTab === "vote"} />
        <TabButton label="Upload" isActive={activeTab === "upload"} />
        <TabButton label="Referral" isActive={activeTab === "referral"} />
      </div>

      <div className="overflow-y-auto scrollbar-hide">{renderContent()}</div>
    </div>
  );
}