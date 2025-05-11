import { Context } from "@/context/contextProvider";
import axiosInstance from "@/utils/axiosInstance";
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogRoot,
} from "@chakra-ui/react";
import React, { useContext } from "react";
import { CgCloseO } from "react-icons/cg";
import { ShareSocial } from "react-share-social";

interface ShareProps {
  isOpen?: boolean;
  onClose?: () => void;
  onShare?: () => void;
  imageUrl: string | undefined;
  id: string | undefined;
}

const Share = ({
  isOpen = true,
  onClose = () => {},
  onShare = () => {},
  imageUrl,
  id,
}: ShareProps) => {
  const { userDetails } = useContext(Context);
  const addShare = async (memeId: string, userId: string) => {
    try {
      const response = await axiosInstance.post("/api/share", {
        memeId,
        userId,
      });
      return response.data;
    } catch {
      return null;
    }
  };
  return (
    <div className="share-container">
      <DialogRoot
        open={isOpen}
        motionPreset="slide-in-bottom"
        placement={"center"}
      >
        <DialogBackdrop className="backdrop-blur-md" />
        <DialogContent className="fixed md:inset-10 bg-[#141e29] border-2 border-[#1783fb] w-[90vw] md:h-min p-0">
          <DialogBody className="mt-8 md:p-10">
            <CgCloseO
              onClick={onClose}
              className="z-50 absolute -top-5 md:-top-6 -right-5 text-white w-5 h-5"
            />
            {imageUrl && (
              <div className="flex items-center justify-center">
                <div className="h-56 w-56 border-2 border-white">
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col justify-center items-center mt-4 md:mt-8">
              <p className="font-medium text-lg md:text-2xl">
                Share with your Friends
              </p>
              <div className="w-full">
                <ShareSocial
                  url={`${process.env.NEXT_PUBLIC_API_URL}/home?id=${id}`}
                  socialTypes={["facebook", "whatsapp", "twitter", "telegram"]}
                  onSocialButtonClicked={async () => {
                    if (id && userDetails && userDetails._id) {
                      await addShare(id, userDetails._id);
                      onShare();
                    }
                  }}
                />
              </div>
              {/* <div className="flex justify-center items-center space-x-4 mt-1">
              <div className="rounded border border-[#1783fb] p-1">
                <img
                  src={instagram.src}
                  alt="instagram"
                  className="w-6 h-6 object-cover"
                />
              </div>
              <div className="rounded border border-[#1783fb] p-1">
                <img
                  src={facebook.src}
                  alt="facebook"
                  className="w-6 h-6 object-cover"
                />
              </div>
              <div className="rounded border border-[#1783fb] p-1">
                <img
                  src={whatsapp.src}
                  alt="whatsapp"
                  className="w-6 h-6 object-cover"
                />
              </div>
              <div className="rounded border border-[#898989] p-1">
                <img
                  src={twitter.src}
                  alt="twitter"
                  className="w-6 h-6 object-cover"
                />
              </div>
            </div> */}
            </div>
            {/* <div className="mt-6 flex justify-center items-center space-x-4">
            <Input
              type="text"
              value={`${process.env.NEXT_PUBLIC_API_URL}/home?id=${id}`}
              className="rounded-xl outline-none px-4 w-60 text-white text-lg border-2 border-[#1783fb]"
            />
            <Button
              variant="plain"
              size="sm"
              className="text-xl"
              onClick={clipboard.copy}
            >
              {clipboard.copied ? "Copied" : "Copy Link"}
            </Button>
          </div> */}
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </div>
  );
};

export default Share;
