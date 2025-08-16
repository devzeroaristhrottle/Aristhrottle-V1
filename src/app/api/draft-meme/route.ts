import connectToDatabase from '@/lib/db'
import DraftMeme from '@/models/DraftMeme'
import User from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withApiLogging } from '@/utils/apiLogger'
import { uploadToGCS } from '@/config/googleStorage'

async function handleGetRequest(req: NextRequest) {
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

    // Get query parameters
    const query = new URLSearchParams(req.nextUrl.search)
    const id = query.get('id') // For getting a specific draft
    const off = query.get('offset')
    const defaultOffset = 30
    const offset = off == null ? defaultOffset : parseInt(off.toString())
    const start = offset <= defaultOffset ? 0 : offset - defaultOffset

    // If a specific draft ID is requested
    if (id) {
      const draft = await DraftMeme.findOne({
        _id: id,
        created_by: user._id
      }).populate('tags')

      if (!draft) {
        return NextResponse.json(
          { error: 'Draft not found or you do not have permission to access it' },
          { status: 404 }
        )
      }

      return NextResponse.json({ draft }, { status: 200 })
    }

    // Get all drafts for the user with pagination
    const draftsQuery = {
      created_by: user._id,
      is_published: false
    }
    
    const totalCount = await DraftMeme.countDocuments(draftsQuery)
    
    const drafts = await DraftMeme.find(draftsQuery)
      .sort({ last_edited: -1 }) // Most recently edited first
      .skip(start)
      .limit(defaultOffset)
      .populate('tags')

    return NextResponse.json(
      { drafts, totalCount },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    )
  }
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

    const formData = await req.formData()

    const id = formData.get('id') as string // Existing draft ID if updating
    const name = formData.get('name') as string
    const file = formData.get('file') as File | null
    const raw_tags = JSON.parse((formData.get('tags') as string) || '[]')
    const draft_data = JSON.parse((formData.get('draft_data') as string) || '{}')
    
    let image_url
    
    // Handle image upload if provided
    if (file) {
      // Convert file to Buffer for upload
      const buffer = Buffer.from(await file.arrayBuffer())

      // Upload to Google Cloud Storage
      image_url = await uploadToGCS(
        buffer,
        file.name,
        file.type,
        'draft-meme'
      )
    }
    
    // If updating an existing draft
    if (id) {
      // Make sure the user owns this draft
      const existingDraft = await DraftMeme.findOne({
        _id: id,
        created_by: user._id
      })

      if (!existingDraft) {
        return NextResponse.json(
          { error: 'Draft not found or you do not have permission to edit it' },
          { status: 404 }
        )
      }

      // Update fields that were provided
      const updateData: any = {
        last_edited: new Date()
      }

      if (name) updateData.name = name
      if (image_url) updateData.image_url = image_url
      if (raw_tags.length > 0) updateData.raw_tags = raw_tags
      if (Object.keys(draft_data).length > 0) updateData.draft_data = draft_data

      // Update the draft
      const updatedDraft = await DraftMeme.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate('tags')

      return NextResponse.json({ draft: updatedDraft }, { status: 200 })
    } else {
      // Create a new draft
      const newDraft = new DraftMeme({
        name,
        image_url,
        raw_tags,
        created_by: user._id,
        draft_data
      })

      const savedDraft = await newDraft.save()

      return NextResponse.json({ draft: savedDraft }, { status: 201 })
    }
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Delete a draft
async function handleDeleteRequest(req: NextRequest) {
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

    // Get the draft ID from the URL
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    // Make sure the user owns this draft
    const existingDraft = await DraftMeme.findOne({
      _id: id,
      created_by: user._id
    })

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Draft not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete the draft
    await DraftMeme.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Draft deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export const GET = handleGetRequest
export const POST = withApiLogging(handlePostRequest, 'Draft_Meme')
export const DELETE = withApiLogging(handleDeleteRequest, 'Delete_Draft_Meme') 