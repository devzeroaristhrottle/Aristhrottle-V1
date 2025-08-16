import connectToDatabase from '@/lib/db'
import DraftMeme from '@/models/DraftMeme'
import Meme from '@/models/Meme'
import Tags from '@/models/Tags'
import User from '@/models/User'
import { updateTagsRelevance, updateTagCooccurrences } from '@/utils/tagUtils'
import { generateReferralCodeIfEligible } from '@/utils/referralUtils'
import axiosInstance from '@/utils/axiosInstance'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getToken } from 'next-auth/jwt'
import { withApiLogging } from '@/utils/apiLogger'
import { processActivityMilestones } from '@/utils/milestoneUtils'
import { MAJORITY_PERCENTILE_THRESHOLD } from '@/config/rewardsConfig'

type Tag = {
  _id: mongoose.Types.ObjectId
  name: string
  count: number
  vote_count: number
  share_count: number
  upload_count: number
  relevance: number
  created_by: mongoose.Types.ObjectId | string
}

async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase()

    // Authenticate the user
    const token = await getToken({ req })
    if (!token || !token.address) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the user
    const user = await User.findOne({ user_wallet_address: token.address })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { message: 'Draft ID is required' },
        { status: 400 }
      )
    }

    // Find the draft and make sure it belongs to the user
    const draft = await DraftMeme.findOne({
      _id: id,
      created_by: user._id,
      is_published: false
    })

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found or already published' },
        { status: 404 }
      )
    }

    // Process tags
    let tags: mongoose.Types.ObjectId[] = []

    if (draft.raw_tags && draft.raw_tags.length > 0) {
      const gotTags = draft.raw_tags
      const existingTags = await Tags.find({ name: { $in: gotTags } })
      const existing_tags = existingTags.map(tag => tag._id)
      const existingTagNames = new Set(existingTags.map(tag => tag.name))
      const new_tags = gotTags.filter(
        (name: string) => !existingTagNames.has(name)
      )

      if (existing_tags.length > 0) {
        const tagIds = existing_tags.map(
          (id: string) => new mongoose.Types.ObjectId(id)
        )
        tags = [...tags, ...tagIds]

        // Update count and upload_count field for each tag
        await Tags.updateMany(
          { _id: { $in: tagIds } },
          {
            $inc: {
              count: 1,
              upload_count: 1,
            },
          }
        )

        // Update the relevance scores for the tags
        await updateTagsRelevance(tagIds)
      }

      if (new_tags.length > 0) {
        const tagData = new_tags.map((tag: string) => ({
          count: 1,
          upload_count: 1,
          name: tag,
          created_by: user._id.toString(),
        }))

        const insertedTags = (await Tags.insertMany(tagData, {
          ordered: false,
        })) as Tag[]
        const tagIds = insertedTags.map(tag => tag._id)
        tags = [...tags, ...tagIds]
      }

      // Update tag co-occurrences if there are multiple tags
      if (tags.length > 1) {
        await updateTagCooccurrences(tags)
      }
    }

    // Create a new meme from the draft
    const newMeme = new Meme({
      vote_count: 0,
      name: draft.name,
      image_url: draft.image_url,
      tags,
      categories: [],
      created_by: user._id,
      winning_number: 0,
      in_percentile: 0,
      is_voting_close: false,
      voting_days: 1,
      is_claimed: false,
      is_onchain: false,
      shares: [],
      bookmarks: [],
    })

    const savedMeme = await newMeme.save()

    // Mark draft as published
    draft.is_published = true
    await draft.save()

    // Generate a referral code for the user if they don't have one yet
    await generateReferralCodeIfEligible(user._id.toString())

    // Send notification
    await axiosInstance.post('/api/notification', {
      title: 'New meme alert! 🔥',
      message: `🚀 BOOM! New meme dropped: ${draft.name} 😂🔥 Watch now!`,
      type: 'upload',
      notification_for: user._id.toString(),
    })

    // Process milestone rewards
    await processActivityMilestones(
      user._id.toString(),
      'upload',
      Meme,
      { created_by: user._id }, // Total uploads query
      { // Majority uploads query
        is_onchain: true,
        created_by: user._id,
        in_percentile: { $gte: MAJORITY_PERCENTILE_THRESHOLD }
      }
    )

    return NextResponse.json({ 
      meme: savedMeme,
      message: 'Draft published successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error publishing draft:', error)
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export const POST = withApiLogging(handlePostRequest, 'Publish_Draft_Meme') 