"use client";
import { User } from "@/constants/constant";
import React, { createContext, useState } from "react";

type Props = {
  children: React.ReactNode;
};

interface ContextProviderI {
  userDetails: User | undefined;
  isUploadMemeOpen: boolean;
  isRefreshMeme: boolean;
  setUserDetails: React.Dispatch<React.SetStateAction<User | undefined>>;
  setIsUploadMemeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultContextValue: ContextProviderI = {
  userDetails: undefined,
  isUploadMemeOpen: false,
  isRefreshMeme: false,
  setUserDetails: () => {},
  setIsUploadMemeOpen: () => {},
  setIsRefresh: () => {},
};
export const Context = createContext<ContextProviderI>(defaultContextValue);

export default function ContextProvider({ children }: Props) {
  const [userDetails, setUserDetails] = useState<User>();
  const [isUploadMemeOpen, setIsUploadMemeOpen] = useState(false);
  const [isRefreshMeme, setIsRefresh] = useState(false);

  return (
    <Context.Provider
      value={{
        userDetails,
        setUserDetails,
        isUploadMemeOpen,
        setIsUploadMemeOpen,
        isRefreshMeme,
        setIsRefresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
