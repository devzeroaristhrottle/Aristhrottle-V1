import Navbar from "@/components/Navbar";
import { Switch } from "@/components/ui/switch";
import UploadMeme from "@/components/UploadMeme";
import Sidebar from "./sidebar/Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="bg1">
      <div className="flex flex-col">
        <div className="fixed h-screen max-h-dvh !z-[100]">
          <Sidebar />
          <Switch size="md" className="absolute bottom-8 translate-x-1/4" />
        </div>
        <div className="min-h-dvh max-w-screen">
          <Navbar />
          <div className="mt-2 md:mt-10">{children}</div>
        </div>
      </div>
      <UploadMeme />
    </div>
  );
}
