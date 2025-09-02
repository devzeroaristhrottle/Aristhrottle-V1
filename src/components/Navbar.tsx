"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { defineStyle, Input, Popover, Portal } from "@chakra-ui/react";
import axiosInstance from "@/utils/axiosInstance";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { Context } from "@/context/contextProvider";
import { useRouter } from "next/navigation";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import FeedbackModal from '../components/feedback';

// import Notifications from './Notifications'
import useCountdown from "@/app/hooks/useCountdown";
import { GoogleTranslate } from "./languageSupport";
import {
  useAuthModal,
  useLogout,
  useUser,
  useSigner,
  useSmartAccountClient,
  useSignMessage,
} from "@account-kit/react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { ethers } from "ethers";

export default function Navbar() {
  const [isOpenModel, setIsOpenModel] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const ref = useRef<HTMLInputElement>(null);
  const { setUserDetails, userDetails } = useContext(Context);
  const [loading, setLoading] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();

  const signer = useSigner();

  const message = "signUsingAlchemyWallet";
  const { client, address } = useSmartAccountClient({});
  const [open, setOpen] = useState(false);

  const { signMessageAsync, isSigningMessage } = useSignMessage({
    client,
    // these are optional
    onSuccess: () => {},
    onError: (error) => console.error(error),
  });

  const route = useRouter();
  const timeLeft = useCountdown();
  const ringCss = defineStyle({
    outlineWidth: "2px",
    outlineColor: "colorPalette.500",
    outlineOffset: "2px",
    outlineStyle: "solid",
  });

  useEffect(() => {
    const signCheck = async () => {
      if (user && !isSigningMessage) {
        let signature;
        if (user.email && signer) {
          signature = await signer.signMessage(message);
        } else {
          signature = await signMessageAsync({ message: message });
        }

        if (signature && user && user.address) {
          await signIn("credentials", {
            message,
            signature,
            wallet: user.address,
            redirect: false, // optional
          });
        }
      }
    };
    signCheck();
  }, [user]);

  useEffect(() => {
    const getAccount = async () => {
      if (user && user.address) {
        const res = await axiosInstance.get(`/api/user?wallet=${user.address}`);
        if (res.status == 200 && res.data.error === "User not found") {
          setIsOpenModel(true);
        }
        let genCount = 0;
        if (res.data.user.generations) genCount = res.data.user.generations;
        if (res.status == 200 && res.data) {
          setUserDetails({
            ...res.data.user,
            ...res.data,
            totalVotesReceived: res.data.totalVotesReceived[0]
              ? res.data.totalVotesReceived[0].totalVotes
              : 0,
            generations: genCount,
          });
        }
      }
    };
    getAccount();
  }, [user, setUserDetails]);

  const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleBio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value);
  };

  const handleReferralCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferralCode(e.target.value);
  };

  const handleSave = async () => {
    try {
      if (user) {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("user_wallet_address", user.address);
        formData.append("referral_code", referralCode);
        formData.append("bio", bio);
        formData.append("tags", JSON.stringify([]));

        const response = await axiosInstance.post(`/api/user`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (response.status == 201) {
          toast.success("Your account has been created");
          setUserDetails(response.data.user);
          setIsOpenModel(false);
        }
      }
      setLoading(true);
    } catch (error) {
      console.log(error, "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-black bg-opacity-80" style={{
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      background: 'rgba(0, 0, 0, 0.8)'
    }}>
      <div className="relative w-full">
        {/* Mobile Layout - Always render base structure, conditionally show content */}
        <div className="block md:hidden w-full">
          {/* Always show basic mobile navbar structure */}
          <div className="w-full px-0 py-0 bg-black bg-opacity-20" style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}>
            
            {/* Show login button if user not connected */}
            {(!user || !user.address) && (
              <div className="flex justify-center items-center w-full px-4 py-3">
                <Button
                  size="lg"
                  variant="solid"
                  className="bg-slate-50 text-slate-800 font-bold px-6 py-2 rounded-xl text-base"
                  onClick={() => openAuthModal()}
                >
                  Login / Signup
                </Button>
              </div>
            )}

            {/* Show full navbar if user is connected */}
            {userDetails && user && user.address && (
              <div className="flex flex-col w-full">
                
                {/* First Row - Avatar and Token Balance */}
                <div className="flex items-center justify-between w-full px-3 py-2">
                  {/* Left Side - Avatar */}
                  <div className="flex items-center flex-shrink-0">
                    <Avatar
                      name="Random"
                      colorPalette="blue"
                      src={userDetails.profile_pic}
                      css={ringCss}
                      className="cursor-pointer"
                      size="sm"
                      onClick={() => {
                        route.replace("/home/profile");
                      }}
                    />
                  </div>

                  {/* Right Side - Token Balance */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Image
                      className="w-6 h-6"
                      alt="icon"
                      src="/assets/token_e.png"
                      height={24}
                      width={24}
                    />
                    <span className="text-white text-lg font-medium">
                      {userDetails?.mintedCoins
                        ? parseFloat(ethers.formatEther(userDetails.mintedCoins)).toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="text-white text-lg font-medium">$ART</span>
                  </div>
                </div>

                {/* Second Row - Stats - Compact Mobile Layout */}
                <div className="flex items-center justify-between w-full px-2 py-1">
                  {/* Vote Stats */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-white text-xs font-medium">Vote</span>
                    <div className="border border-white rounded px-2 py-1 bg-gray-800 bg-opacity-50 min-w-[40px]">
                      <span className="text-white text-xs font-medium">
                        {userDetails.votes || 0}/20
                      </span>
                    </div>
                  </div>

                  {/* Upload Stats */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-white text-xs font-medium">Upload</span>
                    <div className="border border-white rounded px-2 py-1 bg-gray-800 bg-opacity-50 min-w-[40px]">
                      <span className="text-white text-xs font-medium">
                        {userDetails.uploads || 0}/20
                      </span>
                    </div>
                  </div>

                  {/* Create Stats */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-white text-xs font-medium">Create</span>
                    <div className="border border-white rounded px-2 py-1 bg-gray-800 bg-opacity-50 min-w-[32px]">
                      <span className="text-white text-xs font-medium">
                        {userDetails.generations || 0}/5
                      </span>
                    </div>
                  </div>

                  {/* New Phase Timer */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-white text-xs font-medium whitespace-nowrap">Phase</span>
                    <div className="border border-white rounded px-2 py-1 bg-gray-800 bg-opacity-50 min-w-[50px]">
                      <span className="text-white text-xs font-medium">
                        {timeLeft ? timeLeft.split(":").slice(0, 2).join(":") : "00:00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Third Row - Feedback Section */}
                <div className="flex justify-center items-center w-full px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium">Fill for 5 $eART</span>
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="border border-white rounded-full px-6 py-2 bg-gray-800 bg-opacity-50 hover:bg-gray-700 hover:bg-opacity-60 transition-colors"
                    >
                      <span className="text-white text-sm font-medium">Feedback</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between align-middle items-center py-0 md:py-0 px-2 sm:px-4 md:px-0">
          <div className="flex align-middle items-center gap-5">
            {userDetails && user != null && user.address && (
              <div className="flex gap-5">
                <Avatar
                  name="Random"
                  colorPalette="blue"
                  src={userDetails.profile_pic}
                  css={ringCss}
                  className="ml-5 cursor-pointer "
                  size={"xs"}
                  onClick={() => {
                    route.replace("/home/profile");
                  }}
                />
                <div className="flex gap-1 items-center">
                  <label>Votes</label>
                  <p className="border border-white rounded-md p-1">
                    {userDetails.votes}/20
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <label>Uploads</label>
                  <p className="border border-white rounded-md p-1">
                    {userDetails.uploads}/20
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <label>Generated</label>
                  <p className="border border-white rounded-md p-1">
                    {userDetails.generations}/5
                  </p>
                </div>
                <div className="flex gap-1 items-center relative group">
                  <label>Next phase starts</label>
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-white cursor-help mx-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="border border-white w-[90px] text-center rounded-md p-1">
                    {timeLeft}
                  </p>
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-semibold mb-1">Info button</div>
                    <div>
                      Content goes from live to leaderboard with the vote count
                      visible. 
                      <div>Votes, uploads and generated counts reset for the
                      user</div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
                
                {/* Desktop Feedback Section */}
                <div className="flex gap-1 items-center">
                  <label>Earn 5 $eART</label>
                  <span className="text-yellow-400 text-lg">👉</span>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="border border-white rounded-md px-2 py-1 hover:bg-gray-800 hover:bg-opacity-50 transition-colors"
                  >
                    Feedback
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="hidden lg:block w-64">
              <GoogleTranslate />
            </div>
            <main className="py-2">
              <Popover.Root
                open={open}
                onOpenChange={(e) => {
                  if (!e.open && user && user.address) {
                    setOpen(e.open);
                  }
                }}
              >
                <Popover.Trigger asChild>
                  <Button
                    size="lg"
                    variant="solid"
                    className="bg-slate-50 text-slate-800 font-bold px-3 rounded-xl text-lg"
                    onClick={() => {
                      if (user && user.address) {
                        setOpen(true);
                      } else {
                        openAuthModal();
                      }
                    }}
                  >
                    {user
                      ? "0" +
                        user.address.slice(1, 4) +
                        ".." +
                        user.address.slice(
                          user.address.length - 3,
                          user.address.length
                        )
                      : "Login / Signup"}
                  </Button>
                </Popover.Trigger>
                <Portal>
                  <Popover.Positioner>
                    <Popover.Content className="bg-slate-50">
                      <Popover.Arrow />
                      <Popover.Body className="flex flex-col">
                        <Popover.Title
                          fontWeight="medium"
                          className="text-slate-900 text-base mb-4"
                        >
                          <p>
                            <strong>Wallet (EOA): </strong>
                            {user?.address}
                          </p>
                          <p>
                            <strong>Smart Account: </strong>
                            {address}
                          </p>
                        </Popover.Title>
                        <Button
                          size="lg"
                          variant="solid"
                          className="text-slate-50 font-bold px-3 bg-slate-900"
                          onClick={() => {
                            logout();
                            setOpen(false);
                            setUserDetails(undefined);
                            route.replace("/landing");
                          }}
                        >
                          Disconnect
                        </Button>
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
            </main>
            {user?.address ? (
              <div className="flex items-center justify-center gap-2">
                <Image
                  className="w-10 h-10"
                  alt="icon"
                  src="/assets/token_e.png"
                  height={24}
                  width={24}
                />
                <span className="text-2xl">
                  {userDetails?.mintedCoins
                    ? ethers.formatEther(userDetails.mintedCoins)
                    : 0}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Hidden Popover for Mobile Functionality */}
        <Popover.Root
          open={open}
          onOpenChange={(e) => {
            if (!e.open && user && user.address) {
              setOpen(e.open);
            }
          }}
        >
          <Popover.Trigger asChild>
            <div className="hidden"></div>
          </Popover.Trigger>
        </Popover.Root>

        <DialogRoot
          open={isOpenModel}
          motionPreset="slide-in-bottom"
          initialFocusEl={() => ref.current}
        >
          {/* Improved, conditional backdrop blur */}
          {isOpenModel && (
            <div className="fixed inset-0 z-0 bg-black bg-opacity-40 pointer-events-none w-screen h-screen" style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }} />
          )}
          <DialogContent className="relative z-10 mx-4 md:mx-0 bg-black p-6 rounded-lg border border-white text-lg">
            <DialogHeader>
              <DialogTitle className="text-3xl">Create Account</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Field label="Account Address">
                <Input
                  className="px-2 bg-gray-800"
                  variant="subtle"
                  placeholder="Enter Username"
                  value={user?.address}
                  readOnly
                />
              </Field>
              <Field label="Username" className="mt-3">
                <Input
                  ref={ref}
                  className="px-2 bg-gray-800"
                  variant="subtle"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => handleUsername(e)}
                />
              </Field>
              <Field label="Bio" className="mt-3">
                <Input
                  ref={ref}
                  className="px-2 bg-gray-800"
                  variant="subtle"
                  placeholder="Enter Bio"
                  value={bio}
                  height={"150px"}
                  onChange={(e) => handleBio(e)}
                />
              </Field>
              <Field label="Referral Code" className="mt-3 mb-5">
                <Input
                  className="px-2 w-full bg-gray-800"
                  variant="subtle"
                  placeholder="Enter Referral Code"
                  value={referralCode}
                  maxLength={6}
                  onChange={(e) => handleReferralCode(e)}
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button
                disabled={loading}
                variant="solid"
                className={"bg-[#192666] px-4 py-2 hover:bg-blue-900"}
                onClick={handleSave}
              >
                {loading ? (
                  <AiOutlineLoading3Quarters className="text-white animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
          userWalletAddress={user?.address} 
        />
      </div>
    </div>
  );
}