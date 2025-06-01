import cloudinary from "@/config/cloudinary";
import { contract } from "@/ethers/contractUtils";
import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import User from "@/models/User";
import Vote from "@/models/Vote";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import Followers from "@/models/Followers";
import { ethers } from "ethers";

// Function to generate a random alphanumeric referral code (length: 8)
// const generateReferralCode = () => {
//   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let code = "";
//   for (let i = 0; i < 6; i++) {
//     code += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return code;
// };

// Function to generate a unique referral code and store it in DB
// const generateUniqueReferralCode = async () => {
//   let code;
//   let isUnique = false;

//   while (!isUnique) {
//     code = generateReferralCode();
//     const existingUser = await User.findOne({ refer_code: code });
//     if (!existingUser) {
//       isUnique = true;
//     }
//   }
//   return code;
// };

async function handleGetRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const wallet_address = new URLSearchParams(request.nextUrl.search).get(
      "wallet"
    );

    // Fetch all users
    const user = await User.findOne().where({
      user_wallet_address: wallet_address,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    const token = await getToken({ req: request });

    if (token == null || !token.address || token.address != wallet_address) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (wallet_address) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0); // Set to the start of the day (UTC)

      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999); // Set to the end of the day (UTC)

      const todayUploads = await Meme.find({
        created_by: user.id,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).countDocuments();

      const todayVotes = await Vote.find({
        vote_by: user.id,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).countDocuments();

      const totalCastedVotesCount = await Vote.find({
        vote_by: user.id,
      }).countDocuments();

      const totalUploadsCount = await Meme.find({
        created_by: user.id,
      }).countDocuments();
      
      // Get follower counts
      const followersCount = await Followers.countDocuments({ following: user.id });
      const followingCount = await Followers.countDocuments({ follower: user.id });

      const totalVotesReceived = await Meme.aggregate([
        {
          $match: {
            created_by: new mongoose.Types.ObjectId(user.id), // Step 1: filter memes created by this user
          },
        },
        {
          $group: {
            _id: null, // Step 2: group all matched memes together (no need to group by fields)
            totalVotes: { $sum: "$vote_count" }, // Step 3: sum their vote_count
          },
        },
      ]);

      const majorityUploads = await Meme.find({
        is_onchain: true,
        created_by: user.id,
        in_percentile: { $gte: 51 },
      }).countDocuments();

      const majorityVotes = await Vote.find({
        is_onchain: true,
        vote_by: user.id,
      })
        .populate("vote_by")
        .populate({
          path: "vote_to",
          match: { is_onchain: true, in_percentile: { $gte: 51 } },
        })
        .countDocuments();

      const mintedCoins = await contract.balanceOf(wallet_address);

      return NextResponse.json(
        {
          user: user,
          uploads: todayUploads,
          votes: todayVotes,
          totalCastedVotesCount: totalCastedVotesCount,
          totalUploadsCount: totalUploadsCount,
          totalVotesReceived: totalVotesReceived,
          majorityUploads: majorityUploads,
          majorityVotes: majorityVotes,
          followersCount: followersCount,
          followingCount: followingCount,
          mintedCoins: BigInt(mintedCoins).toString(),
        },
        { status: 200 }
      );
    } else {
      throw "Wallet address not found";
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();

    const username = formData.get("username") as string;
    const user_wallet_address = formData.get("user_wallet_address") as string;
    const referral_code = formData.get("referral_code") as string;
    const bio = formData.get("bio") as string;
    const file = formData.get("file") as File;
    const tags = JSON.parse((formData.get("tags") as string) || "[]");
    const interests = JSON.parse((formData.get("interests") as string) || "[]");

    // Validate input
    if (!username || !user_wallet_address) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate interests format if provided
    if (interests.length > 0) {
      if (interests.length > 5) {
        return NextResponse.json(
          { error: "Maximum 5 interest categories allowed" },
          { status: 400 }
        );
      }

      for (const interest of interests) {
        if (!interest.name) {
          return NextResponse.json(
            { error: "Each interest category must have a name" },
            { status: 400 }
          );
        }
        
        if (interest.tags && interest.tags.length > 10) {
          return NextResponse.json(
            { error: `Interest category '${interest.name}' cannot have more than 10 tags` },
            { status: 400 }
          );
        }
      }
    }

    const token = await getToken({ req: request });

    if (
      token == null ||
      !token.address ||
      token.address != user_wallet_address
    ) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    let profile_pic = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4_WP3VdprlZKs2I6Flr83IcWk5QeZhXGO-g&s";

    if (file) {
      // Convert file to Buffer for IPFS upload
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary
      const base64Image = `data:${file.type};base64,${buffer.toString(
        "base64"
      )}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "profile", // Optional folder name
      });

      profile_pic = uploadResult.secure_url;
    }

    // Create a new user - without referral code initially
    const newUser = new User({
      username: username,
      user_wallet_address: user_wallet_address,
      bio: bio,
      tags: tags,
      profile_pic: profile_pic,
      interests: interests
    });

    // Process referral code if provided
    if (
      referral_code &&
      referral_code.length > 0 &&
      referral_code.length == 6
    ) {
      const existingUser = await User.findOne({ refer_code: referral_code });
      if (existingUser) {
        // We'll store this information for later when this user becomes eligible
        // to have their own referral code
        newUser.referred_by = referral_code;
      }
    }

    const savedUser = await newUser.save();

    // Mint 5 tokens if the user was referred
    if (savedUser.referred_by && savedUser.user_wallet_address) {
      try {
        // Mint 5 tokens (adjust amount as needed)
        const amountToMint = 5;
        const tx = await contract.mintCoins(savedUser.user_wallet_address, ethers.parseUnits(amountToMint.toString(), 18));
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Minted ${amountToMint} tokens to ${savedUser.user_wallet_address} for referral.`);
      } catch (mintError) {
        console.error("Error minting tokens for referred user:", mintError);
        // Optionally handle the error, e.g., log to a specific table or notify admin
      }
    }

    return NextResponse.json({ user: savedUser }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
      }
    );
  }
}

async function handlePutRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();

    const user_wallet_address = formData.get("user_wallet_address") as string;
    const new_username = formData.get("new_username") as string;
    const bio = formData.get("bio") as string;
    const file = formData.get("file") as File;
    const tags = JSON.parse((formData.get("tags") as string) || "[]");
    const interests = JSON.parse((formData.get("interests") as string) || "[]");

    if (!user_wallet_address) {
      return NextResponse.json(
        { message: "Missing wallet address" },
        { status: 400 }
      );
    }

    // Validate interests format if provided
    if (interests.length > 0) {
      if (interests.length > 5) {
        return NextResponse.json(
          { error: "Maximum 5 interest categories allowed" },
          { status: 400 }
        );
      }

      for (const interest of interests) {
        if (!interest.name) {
          return NextResponse.json(
            { error: "Each interest category must have a name" },
            { status: 400 }
          );
        }
        
        if (interest.tags && interest.tags.length > 10) {
          return NextResponse.json(
            { error: `Interest category '${interest.name}' cannot have more than 10 tags` },
            { status: 400 }
          );
        }
      }
    }

    const token = await getToken({ req: request });

    if (
      token == null ||
      !token.address ||
      token.address != user_wallet_address
    ) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const user = await User.findOne().where({
      user_wallet_address: user_wallet_address,
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (new_username) {
      user.username = new_username;
    }
    if (bio) {
      user.bio = bio;
    }

    if (tags.length > 0) {
      user.tags = tags;
    }

    // Update interests if provided
    if (interests.length > 0) {
      user.interests = interests;
    }

    if (file) {
      // Convert file to Buffer for IPFS upload
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary
      const base64Image = `data:${file.type};base64,${buffer.toString(
        "base64"
      )}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "profile", // Optional folder name
      });

      user.profile_pic = uploadResult.secure_url;
    }

    const updatedUser = await user.save();

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
      }
    );
  }
}


export const GET = handleGetRequest;
export const POST = withApiLogging(handlePostRequest, "Create_User");
export const PUT = withApiLogging(handlePutRequest, "Update_User");
