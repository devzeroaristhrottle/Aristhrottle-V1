"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  DialogBackdrop,
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

import Notifications from "./Notifications";
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

export default function Navbar() {
  const [isOpenModel, setIsOpenModel] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const ref = useRef<HTMLInputElement>(null);
  const { setUserDetails, userDetails } = useContext(Context);
  const [loading, setLoading] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<string>("");

  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();

  const signer = useSigner();

  const message = "signUsingAlchemyWallet";
  const { client } = useSmartAccountClient({});
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
        if (res.status == 200 && res.data) {
          setUserDetails({
            ...res.data.user,
            ...res.data,
            totalVotesReceived: res.data.totalVotesReceived[0]
              ? res.data.totalVotesReceived[0].totalVotes
              : 0,
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
    <div className="sticky top-0 z-50 backdrop-blur-md bg-black/20">
      <div className="relative w-[100%] pr-4 md:pr-10">
        <div className="flex justify-between align-middle items-center py-5">
          <div className="flex align-middle items-center w-1/2 gap-5">
            {userDetails && user != null && user.address && (
              <div className="flex gap-5">
                <Avatar
                  name="Random"
                  colorPalette="blue"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRidBoAmoAGJ8Yl2-8T0EdwgJNWtWLHJoZ55w&s"
                  css={ringCss}
                  className="ml-5 cursor-pointer"
                  size={"xs"}
                  onClick={() => {
                    route.replace("/home/profile");
                  }}
                />
                <div className="hidden md:flex gap-1 items-center">
                  <label>Votes</label>
                  <p className="border border-white rounded-md p-1">
                    {userDetails.votes}/20
                  </p>
                </div>
                <div className="hidden md:flex gap-1 items-center">
                  <label>Uploads</label>
                  <p className="border border-white rounded-md p-1">
                    {userDetails.uploads}/20
                  </p>
                </div>
                <div className="hidden md:flex gap-1 items-center">
                  <label>Next phase starts in</label>
                  <p className="border border-white w-[90px] text-center rounded-md p-1">
                    {timeLeft}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="hidden md:block">
              <GoogleTranslate />
            </div>
            <main className="">
              <Popover.Root
                open={open}
                onOpenChange={(e) => {
                  if (!e.open && user && user.address) {
                    setOpen(e.open);
                  }
                  // setOpen(false);
                }}
              >
                <Popover.Trigger asChild>
                  <Button
                    size={{ base: "xs", md: "lg" }}
                    variant="solid"
                    className="bg-slate-50 text-slate-800 font-bold px-1 md:px-3 rounded-lg md:rounded-xl text-base md:text-lg"
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
                      : "Connect wallet"}
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
                          {user?.address}
                        </Popover.Title>
                        <Button
                          size="lg"
                          variant="solid"
                          className="text-slate-50 font-bold px-3 bg-slate-900"
                          onClick={() => {
                            logout();
                            setOpen(false);
                            route.replace("/home");
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
            {/* <ConnectButton /> */}
            {/* TODO: on hover add eArt Balance */}
            {user?.address ? (
              <div className="flex items-center justify-center gap-2">
                <Image
                  className="!w-6 !h-6"
                  alt="icon"
                  src="/assets/coins/7.png"
                  height={24}
                  width={24}
                />
                <span className="text-2xl">
                  {" "}
                  {userDetails?.mintedCoins ? userDetails.mintedCoins : 0}
                </span>
              </div>
            ) : null}
            <Notifications />
          </div>
        </div>

        <DialogRoot
          open={isOpenModel}
          motionPreset="slide-in-bottom"
          initialFocusEl={() => ref.current}
        >
          <DialogBackdrop />
          <DialogContent className="mx-4 md:mx-0">
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Field label="Account Address">
                <Input
                  className="px-2"
                  variant="subtle"
                  placeholder="Enter Username"
                  value={user?.address}
                  readOnly
                />
              </Field>
              <Field label="Username" className="mt-3">
                <Input
                  ref={ref}
                  className="px-2"
                  variant="subtle"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => handleUsername(e)}
                />
              </Field>
              <Field label="Bio" className="mt-3">
                <Input
                  ref={ref}
                  className="px-2"
                  variant="subtle"
                  placeholder="Enter Bio"
                  value={bio}
                  height={"150px"}
                  onChange={(e) => handleBio(e)}
                />
              </Field>
              <Field label="Referral Code" className="mt-3 mb-5">
                <Input
                  className="px-2 w-full"
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
      </div>
    </div>
  );
}
