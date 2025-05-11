"use client";
import { Context } from "@/context/contextProvider";
import { useAuthModal, useUser } from "@account-kit/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useContext, useRef, useState } from "react";
import { FaRegBookmark } from "react-icons/fa";
import { GrCloudUpload } from "react-icons/gr";
import { IoPodiumOutline } from "react-icons/io5";
import { LuTrophy } from "react-icons/lu";

// Define sidebar items configuration
const sidebarItems = [
  {
    title: "Home",
    icon: (isActive: boolean) => (
      <Image
        alt="side-bar-logo"
        className={`cursor-pointer transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
        height={52}
        quality={100}
        src="/assets/aris-logo.svg"
        width={50}
      />
    ),
    action: (route: AppRouterInstance) => route.replace("/home"),
  },
  {
    title: "Upload",
    icon: (isActive: boolean) => (
      <GrCloudUpload
        className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
      />
    ),
    action: (
      _: AppRouterInstance,
      setIsUploadMemeOpen: Dispatch<SetStateAction<boolean>>,
      isConnected: boolean,
      openConnectModal: (() => void) | undefined
    ) => {
      if (isConnected) {
        setIsUploadMemeOpen(true);
      } else {
        if (openConnectModal) {
          openConnectModal();
        }
      }
    },
  },
  {
    title: "Leaderboard",
    icon: (isActive: boolean) => (
      <IoPodiumOutline
        className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
      />
    ),
    action: (route: AppRouterInstance) => route.replace("/home/leaderboard"),
  },
  {
    title: "Rewards",
    icon: (isActive: boolean) => (
      <LuTrophy
        className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
      />
    ),
    action: (route: AppRouterInstance) => route.replace("/home/rewards"),
  },
  {
    title: "My Votes",
    icon: (isActive: boolean) => (
      <Image
        alt="vote-logo"
        className={`cursor-pointer transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
        height={48}
        quality={100}
        src="/assets/vote-logo.svg"
        width={48}
      />
    ),
    action: (route: AppRouterInstance) => route.replace("/home/myVotes"),
  },
  {
    title: "Bookmarks",
    icon: (isActive: boolean) => (
      <FaRegBookmark
        className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
          isActive ? "text-[#1783FB]" : "text-slate-100"
        }`}
      />
    ),
    action: (route: AppRouterInstance) => route.replace("/home/bookmark"),
  },
];

const Sidebar = () => {
  const route = useRouter();
  const { isUploadMemeOpen, setIsUploadMemeOpen } = useContext(Context);
  const pathname = usePathname();
  const itemRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { openAuthModal } = useAuthModal();
  const user = useUser();

  const getActiveTab = () => {
    if (isUploadMemeOpen) return "Upload";
    if (pathname?.includes("leaderboard")) return "Leaderboard";
    if (pathname?.includes("rewards")) return "Rewards";
    if (pathname?.includes("myVotes")) return "My Votes";
    if (pathname?.includes("bookmark")) return "Bookmarks";
    if (pathname?.includes("profile")) return "Profile";
    return "Home";
  };

  const activeTab = getActiveTab();

  return (
    <>
      <div
        ref={itemRef}
        className="hidden md:fixed left-0 top-1/2 -translate-y-1/2 h-50vh md:flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="hidden md:flex flex-col items-start gap-6 p-4 hover:bg-[#4F4F4F2B] rounded-r-lg hover:backdrop-blur-2xl">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.title;
            return (
              <div key={item.title}>
                <div
                  onClick={() =>
                    item.action(
                      route,
                      setIsUploadMemeOpen,
                      user != null && user.address != null,
                      openAuthModal
                    )
                  }
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="hidden md:group md:flex gap-6 items-center justify-center p-2 rounded-lg cursor-pointer"
                >
                  <div
                    className={`${
                      hoveredItem === item.title && !isActive ? "scale-110" : ""
                    }`}
                  >
                    {item.icon(false)}
                  </div>
                  {isHovered && (
                    <span
                      className={`text-xl font-medium transition-all duration-150 ${
                        isActive
                          ? "text-[#1783FB]"
                          : hoveredItem === item.title
                          ? "hover:scale-105"
                          : "text-white"
                      }`}
                    >
                      {item.title}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* For mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-black/20">
        <div className="flex justify-around items-center py-3">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.title;
            return (
              <div
                key={item.title}
                onClick={() =>
                  item.action(
                    route,
                    setIsUploadMemeOpen,
                    user != null && user.address != null,
                    openAuthModal
                  )
                }
                className="flex flex-col items-center"
              >
                <div
                  className={`transition-transform duration-150 ${
                    isActive ? "scale-110" : "scale-100"
                  }`}
                >
                  <div className="h-6 w-6 flex items-center justify-center">
                    {item.title === "Home" ? (
                      <Image
                        alt="side-bar-logo"
                        height={24}
                        quality={100}
                        src="/assets/aris-logo.svg"
                        width={24}
                      />
                    ) : item.title === "Upload" ? (
                      <GrCloudUpload className="h-6 w-6" />
                    ) : item.title === "Leaderboard" ? (
                      <IoPodiumOutline className="h-6 w-6" />
                    ) : item.title === "Rewards" ? (
                      <LuTrophy className="h-6 w-6" />
                    ) : item.title === "My Votes" ? (
                      <Image
                        alt="vote-logo"
                        height={24}
                        quality={100}
                        src="/assets/vote-logo.svg"
                        width={24}
                      />
                    ) : (
                      <FaRegBookmark className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
