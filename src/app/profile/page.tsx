"use client";
import { Avatar } from "@/components/ui/avatar";
import { Context } from "@/context/contextProvider";
import React, { useContext, useState } from "react";
import { Field } from "@/components/ui/field";
import { defineStyle, Input } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import axiosInstance from "@/utils/axiosInstance";

export default function Page() {
  const { setUserDetails, userDetails } = useContext(Context);
  const [username, setUsername] = useState<string>(
    userDetails?.username ? userDetails.username : ""
  );
  const [loading, setLoading] = useState<boolean>(false);

  const ringCss = defineStyle({
    outlineWidth: "2px",
    outlineColor: "colorPalette.500",
    outlineOffset: "2px",
    outlineStyle: "solid",
  });

  const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      if (userDetails) {
        const response = await axiosInstance.put(`/api/user`, {
          new_username: username,
          user_wallet_address: userDetails.user_wallet_address,
        });
        if (response.status == 200) {
          toast.success("Your username has been updated");
          setUserDetails(response.data.user);
        }
      }
    } catch (error) {
      console.log(error, "Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg">
      <div className="h-screen flex justify-center items-center">
        {userDetails && (
          <div className="w-1/3 grid  align-middle items-center bg-[#111111] p-5 rounded-md">
            <Avatar
              name="Random"
              colorPalette="blue"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRidBoAmoAGJ8Yl2-8T0EdwgJNWtWLHJoZ55w&s"
              css={ringCss}
              className="mx-auto mb-4 text-center"
              size={"lg"}
            />
            <Field label="Account Address">
              <Input
                className="px-2 w-full"
                variant="subtle"
                placeholder="Enter Username"
                value={userDetails.user_wallet_address}
                readOnly
              />
            </Field>
            <Field label="Username" className="mt-3 mb-5">
              <Input
                className="px-2 w-full"
                variant="subtle"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => handleUsername(e)}
              />
            </Field>

           
            <Button
              disabled={loading}
              variant="solid"
              className={"bg-[#192666] px-4 py-2 hover:bg-blue-900"}
              onClick={handleUpdate}
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="text-white animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
