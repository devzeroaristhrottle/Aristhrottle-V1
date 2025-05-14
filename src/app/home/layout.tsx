"use client";
import Navbar from "@/components/Navbar";
import { Switch } from "@/components/ui/switch";
import UploadMeme from "@/components/UploadMeme";
import Sidebar from "./sidebar/Sidebar";
import { GoogleAnalytics } from "@next/third-parties/google";
import {ReactTourProvider} from 'react-interactive-tour';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-FY44ED1KLP";
  return (
    <ReactTourProvider cache={true} >
      <div className="bg1">
        <div className="flex flex-col">
          <div className="fixed h-screen max-h-dvh !z-[100]">
            <Sidebar />
            <Switch size="md" className="absolute bottom-8 translate-x-1/4" />
          </div>
          <div className="min-h-dvh w-dvw ">
            <Navbar />
            <div className="mt-2 md:mt-10">{children}</div>
          </div>
        </div>
        <UploadMeme />
        <GoogleAnalytics gaId={gaId} />
      </div>
    </ReactTourProvider>
  );
}
