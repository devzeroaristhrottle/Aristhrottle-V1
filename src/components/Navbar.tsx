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
        try {
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
              redirect: false,
            });
          }
        } catch (error) {
          console.error("Sign check error:", error);
        }
      }
    };
    signCheck();
  }, [user, isSigningMessage, signMessageAsync, signer]);

  useEffect(() => {
    const getAccount = async () => {
      if (user && user.address) {
        try {
          const res = await axiosInstance.get(`/api/user?wallet=${user.address}`);
          if (res.status === 200 && res.data.error === "User not found") {
            setIsOpenModel(true);
          }
          let genCount = 0;
          if (res.data.user?.generations) genCount = res.data.user.generations;
          if (res.status === 200 && res.data) {
            setUserDetails({
              ...res.data.user,
              ...res.data,
              totalVotesReceived: res.data.totalVotesReceived?.[0]
                ? res.data.totalVotesReceived[0].totalVotes
                : 0,
              generations: genCount,
            });
          }
        } catch (error) {
          console.error("Get account error:", error);
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
    setLoading(true);
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
        if (response.status === 201) {
          toast.success("Your account has been created");
          setUserDetails(response.data.user);
          setIsOpenModel(false);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-[50] w-full max-w-full overflow-hidden bg-black bg-opacity-80 navbar-full-width" style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(0, 0, 0, 0.8)'
      }}>
        <div className="w-full max-w-full">
          {/* Mobile Layout */}
          <div className="block md:hidden w-full">
            <div className="w-full bg-black bg-opacity-20" style={{
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
                  <div className="flex items-center justify-between w-full px-3 py-2 min-h-[3rem]">
                    {/* Left Side - Avatar */}
                    <div className="flex items-center flex-shrink-0">
                      <Avatar
                        name="Random"
                        colorPalette="blue"
                        src={userDetails.profile_pic}
                        css={ringCss}
                        className="cursor-pointer"
                        size="sm"
                        onClick={() => route.replace("/home/profile")}
                      />
                    </div>

                    {/* Right Side - Token Balance */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Image
                        className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                        alt="icon"
                        src="/assets/token_e.png"
                        height={24}
                        width={24}
                      />
                      <span className="text-white text-sm sm:text-lg font-medium truncate max-w-[4rem] sm:max-w-none">
                        {userDetails?.mintedCoins
                          ? parseFloat(ethers.formatEther(userDetails.mintedCoins)).toFixed(1)
                          : "0.0"}
                      </span>
                      <span className="text-white text-sm sm:text-lg font-medium">$ART</span>
                    </div>
                  </div>

                  {/* Second Row - Stats - Improved Mobile Layout */}
                  <div className="grid grid-cols-4 gap-1 px-2 py-1 w-full">
                    {/* Vote Stats */}
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <span className="text-white text-xs font-medium truncate w-full text-center">Vote</span>
                      <div className="border border-white rounded px-1 py-1 bg-gray-800 bg-opacity-50 w-full text-center">
                        <span className="text-white text-xs font-medium">
                          {userDetails.votes || 0}/20
                        </span>
                      </div>
                    </div>

                    {/* Upload Stats */}
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <span className="text-white text-xs font-medium truncate w-full text-center">Upload</span>
                      <div className="border border-white rounded px-1 py-1 bg-gray-800 bg-opacity-50 w-full text-center">
                        <span className="text-white text-xs font-medium">
                          {userDetails.uploads || 0}/20
                        </span>
                      </div>
                    </div>

                    {/* Create Stats */}
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <span className="text-white text-xs font-medium truncate w-full text-center">Create</span>
                      <div className="border border-white rounded px-1 py-1 bg-gray-800 bg-opacity-50 w-full text-center">
                        <span className="text-white text-xs font-medium">
                          {userDetails.generations || 0}/5
                        </span>
                      </div>
                    </div>

                    {/* Phase Timer */}
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <span className="text-white text-xs font-medium truncate w-full text-center">Phase</span>
                      <div className="border border-white rounded px-1 py-1 bg-gray-800 bg-opacity-50 w-full text-center">
                        <span className="text-white text-xs font-medium">
                          {timeLeft ? timeLeft.split(":").slice(0, 2).join(":") : "00:00"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Third Row - Feedback Section */}
                  <div className="flex justify-center items-center w-full px-2 py-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full">
                      <span className="text-white text-xs sm:text-sm font-medium text-center">Fill for 5 $eART</span>
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="border border-white rounded-full px-4 py-1 sm:px-6 sm:py-2 bg-gray-800 bg-opacity-50 hover:bg-gray-700 hover:bg-opacity-60 transition-colors"
                      >
                        <span className="text-white text-xs sm:text-sm font-medium">Feedback</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center py-2 px-4 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-3 lg:gap-5 min-w-0 flex-1">
              {userDetails && user?.address && (
                <div className="flex gap-2 lg:gap-5 items-center min-w-0 flex-wrap">
                  <Avatar
                    name="Random"
                    colorPalette="blue"
                    src={userDetails.profile_pic}
                    css={ringCss}
                    className="cursor-pointer flex-shrink-0"
                    size="xs"
                    onClick={() => route.replace("/home/profile")}
                  />
                  
                  <div className="flex gap-2 lg:gap-4 items-center flex-wrap min-w-0">
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <label className="text-sm">Votes</label>
                      <p className="border border-white rounded-md px-2 py-1 text-sm">
                        {userDetails.votes || 0}/20
                      </p>
                    </div>
                    
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <label className="text-sm">Uploads</label>
                      <p className="border border-white rounded-md px-2 py-1 text-sm">
                        {userDetails.uploads || 0}/20
                      </p>
                    </div>
                    
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <label className="text-sm">Generated</label>
                      <p className="border border-white rounded-md px-2 py-1 text-sm">
                        {userDetails.generations || 0}/5
                      </p>
                    </div>
                    
                    <div className="flex gap-1 items-center relative group flex-shrink-0">
                      <label className="text-sm whitespace-nowrap">Next phase</label>
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-white cursor-help flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="border border-white w-[70px] lg:w-[90px] text-center rounded-md px-1 py-1 text-sm">
                        {timeLeft || "00:00:00"}
                      </p>
                      
                      {/* Tooltip - Improved positioning */}
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60] max-w-xs">
                        <div className="font-semibold mb-1">Phase Info</div>
                        <div className="whitespace-normal">
                          Content goes from live to leaderboard with vote count visible.
                          <br />
                          Votes, uploads and generated counts reset for the user.
                        </div>
                        {/* Arrow */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                      </div>
                    </div>
                    
                    {/* Desktop Feedback Section */}
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <label className="text-sm whitespace-nowrap">Earn 5 $eART</label>
                      <span className="text-yellow-400 text-sm">👉</span>
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="border border-white rounded-md px-2 py-1 hover:bg-gray-800 hover:bg-opacity-50 transition-colors text-sm whitespace-nowrap"
                      >
                        Feedback
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <div className="hidden xl:block w-48 lg:w-64">
                <GoogleTranslate />
              </div>
              
              <div className="py-2">
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
                      className="bg-slate-50 text-slate-800 font-bold px-3 rounded-xl text-base lg:text-lg whitespace-nowrap"
                      onClick={() => {
                        if (user && user.address) {
                          setOpen(true);
                        } else {
                          openAuthModal();
                        }
                      }}
                    >
                      {user
                        ? `0${user.address.slice(1, 4)}..${user.address.slice(-3)}`
                        : "Login / Signup"}
                    </Button>
                  </Popover.Trigger>
                  <Portal>
                    <Popover.Positioner>
                      <Popover.Content className="bg-slate-50 z-[60]">
                        <Popover.Arrow />
                        <Popover.Body className="flex flex-col">
                          <Popover.Title
                            fontWeight="medium"
                            className="text-slate-900 text-base mb-4"
                          >
                            <p className="break-all">
                              <strong>Wallet (EOA): </strong>
                              {user?.address}
                            </p>
                            <p className="break-all">
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
              </div>
              
              {user?.address && (
                <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                  <Image
                    className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0"
                    alt="icon"
                    src="/assets/token_e.png"
                    height={40}
                    width={40}
                  />
                  <span className="text-lg lg:text-2xl font-medium truncate max-w-[6rem] lg:max-w-none">
                    {userDetails?.mintedCoins
                      ? ethers.formatEther(userDetails.mintedCoins)
                      : "0"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogRoot
            open={isOpenModel}
            motionPreset="slide-in-bottom"
            initialFocusEl={() => ref.current}
          >
            <DialogContent className="mx-4 md:mx-0 bg-black p-6 rounded-lg border border-white text-lg max-w-md w-full">
              <DialogHeader>
                <DialogTitle className="text-2xl lg:text-3xl">Create Account</DialogTitle>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <Field label="Account Address">
                  <Input
                    className="px-2 bg-gray-800 w-full"
                    variant="subtle"
                    placeholder="Account Address"
                    value={user?.address || ""}
                    readOnly
                  />
                </Field>
                <Field label="Username">
                  <Input
                    ref={ref}
                    className="px-2 bg-gray-800 w-full"
                    variant="subtle"
                    placeholder="Enter Username"
                    value={username}
                    onChange={handleUsername}
                  />
                </Field>
                <Field label="Bio">
                  <Input
                    className="px-2 bg-gray-800 w-full"
                    variant="subtle"
                    placeholder="Enter Bio"
                    value={bio}
                    height="150px"
                    onChange={handleBio}
                  />
                </Field>
                <Field label="Referral Code">
                  <Input
                    className="px-2 bg-gray-800 w-full"
                    variant="subtle"
                    placeholder="Enter Referral Code"
                    value={referralCode}
                    maxLength={6}
                    onChange={handleReferralCode}
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button
                  disabled={loading}
                  variant="solid"
                  className="bg-[#192666] px-4 py-2 hover:bg-blue-900 w-full sm:w-auto"
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
        </div>
      </div>

      {/* Feedback Modal - Render outside navbar container */}
      {showFeedback && (
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
          userWalletAddress={user?.address} 
        />
      )}
    </>
  );
}