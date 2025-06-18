import connectToDatabase from '@/lib/db'
import Meme from '@/models/Meme'
import Tags from '@/models/Tags'
import User from '@/models/User'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import Vote from '@/models/Vote'
import axiosInstance from '@/utils/axiosInstance'
import Milestone from '@/models/Milestone'
import { checkIsAuthenticated } from '@/utils/authFunctions'
import cloudinary from '@/config/cloudinary'
import { withApiLogging } from '@/utils/apiLogger'
import { updateTagsRelevance, updateTagCooccurrences } from '@/utils/tagUtils'
import { generateReferralCodeIfEligible } from '@/utils/referralUtils'

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

export const config = {
	api: {
		bodyParser: false, // Disable default body parsing
	},
}

async function handleGetRequest(req: NextRequest) {
	try {
		console.log(User)
		await connectToDatabase()

		const query = new URLSearchParams(req.nextUrl.search)
		const name = query.get('name')
		const id = query.get('id')
		const type = query.get('type')
		const created_by = query.get('created_by')
		const vote_by = query.get('vote_by')
		const off = query.get('offset')
		const userId = query.get('userId') // Get userId from query params
		const defaultOffset = 30
		const offset = off == null ? defaultOffset : parseInt(off.toString())
		const start = offset <= defaultOffset ? 0 : offset - defaultOffset

		const memesCount = await Meme.find({
			is_voting_close: false,
			is_onchain: false,
		}).countDocuments()

		if (id) {
			const meme = await Meme.findOne().where({ _id: id }).populate('tags')
			return NextResponse.json({ meme: meme }, { status: 200 })
		}

		if (vote_by && off) {
			const votedMemesCount = await Vote.where({
				vote_by: vote_by,
			}).countDocuments()

			const memes = await Vote.find()
				.where({ vote_by: vote_by })
				.skip(start)
				.limit(defaultOffset)
				.populate('vote_to')
				.populate('vote_by')

			return NextResponse.json(
				{ memes: memes, votedMemesCount: votedMemesCount },
				{ status: 200 }
			)
		}

		if (created_by && off) {
			const memesCount = await Meme.where({
				created_by: created_by,
			}).countDocuments()
			const memes = await Meme.find()
				.where({ created_by: created_by })
				.skip(start)
				.limit(defaultOffset)
				.populate('created_by')

			return NextResponse.json(
				{ memes: memes, memesCount: memesCount },
				{ status: 200 }
			)
		}

		if (name) {
			const names = name.split(',').map(n => n.trim()) // Trim spaces for clean search

			const tagIds = await Tags.find({
				name: { $in: names.map(n => new RegExp(n, 'i')) }, // Case-insensitive search for multiple names
			}).distinct('_id')

			const memes = await Meme.find({
				$or: [
					{ name: { $in: names.map(n => new RegExp(n, 'i')) } }, // Search in names
					{ tags: { $in: tagIds } }, // Search in tags
				],
			})
				.where({ is_voting_close: false })
				.populate('created_by')
				.populate('tags')
			// // .populate('categories')

			return NextResponse.json(
				{ memes, memesCount: memes.length },
				{ status: 200 }
			)
		}

		if (type == 'carousel') {
			const liveMemes = await Meme.find()
				.limit(10)
				.where({ is_onchain: false })
				.populate('created_by')
				.populate('tags')
				.sort({ createdAt: -1 })

			if (liveMemes.length == 0 || liveMemes.length < 5) {
				const memes = await Meme.find()
					.limit(10)
					.populate('created_by')
					.populate('tags')
					.sort({ createdAt: -1 })
				return NextResponse.json(
					{ memes: [...liveMemes, ...memes] },
					{ status: 200 }
				)
			}
			return NextResponse.json({ memes: liveMemes }, { status: 200 })
			// // .populate("categories");
		}

		// const memes = await Meme.find()
		//   .skip(start)
		//   .limit(defaultOffset)
		//   .where({ is_voting_close: false })
		//   .populate("created_by")
		//   .populate("tags")
		//   .sort({ createdAt: -1 });
		// // // .populate("categories");

		const basePipeline: any[] = [
			{ $match: { is_voting_close: false } },
			{ $match: { is_onchain: false } },
			{ $sort: { createdAt: -1 } },
			{ $skip: start },
			{ $limit: defaultOffset },
		]

		// Add common population lookups
		basePipeline.push(
			{
				$lookup: {
					from: 'users',
					localField: 'created_by',
					foreignField: '_id',
					as: 'created_by',
				},
			},
			{ $unwind: '$created_by' },
			{
				$lookup: {
					from: 'tags',
					localField: 'tags',
					foreignField: '_id',
					as: 'tags',
				},
			}
		)

		// If userId is provided, inject vote check logic
		if (userId != null && userId != 'undefined') {
			const userObjectId = new mongoose.Types.ObjectId(userId)
			basePipeline.splice(
				3,
				0, // insert before lookups
				{
					$lookup: {
						from: 'votes',
						let: { memeId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$vote_to', '$$memeId'] },
											{ $eq: ['$vote_by', userObjectId] },
										],
									},
								},
							},
							{ $limit: 1 },
						],
						as: 'userVote',
					},
				},
				{
					$addFields: {
						voted: { $gt: [{ $size: '$userVote' }, 0] },
					},
				},
				{
					$project: {
						userVote: 0,
					},
				}
			)
		}

		const memes = await Meme.aggregate(basePipeline)

		return NextResponse.json(
			{ memes: memes, memesCount: memesCount },
			{ status: 200 }
		)
	} catch (error) {
		console.log(error)

		return NextResponse.json(
			{ error: error },
			{
				status: 500,
			}
		)
	}
}

async function handlePostRequest(req: NextRequest) {
	try {
		if (!process.env.KEY && process.env.PROOF) {
			return NextResponse.json(
				{ message: 'Web3 credentials are missing' },
				{ status: 500 }
			)
		}

		await connectToDatabase()

		const formData = await req.formData()

		const created_by = formData.get('created_by') as string
		const name = formData.get('name') as string
		const file = formData.get('file') as File
		const tagsGot = JSON.parse(formData.get('tags') as string) || []

		// const categories = JSON.parse(
		//   (formData.get("categories") as string) || "[]"
		// );

		// Validate required fields
		if (!created_by || !file || !name) {
			return NextResponse.json(
				{ message: 'Missing required fields' },
				{ status: 400 }
			)
		}

		await checkIsAuthenticated(created_by, req)

		await isLimitReached(created_by)

		// Convert file to Buffer for IPFS upload
		const buffer = Buffer.from(await file.arrayBuffer())

		// Upload to Cloudinary
		const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

		const uploadResult = await cloudinary.uploader.upload(base64Image, {
			folder: 'memes', // Optional folder name
		})

		const image_url = uploadResult.secure_url

		let tags: mongoose.Types.ObjectId[] = []

		// let categoriesIds: mongoose.Types.ObjectId[] = [];

		// if (categories.length > 0) {
		//   categoriesIds = categories.map(
		//     (id: string) => new mongoose.Types.ObjectId(id)
		//   );

		//   // Update count field for each category
		//   await Categories.updateMany(
		//     { _id: { $in: categoriesIds } },
		//     { $inc: { count: 1 } }
		//   );
		// }

		const exsistTagIds = []
		const tagIds = []
		for (const gotTag of tagsGot) {
			const update = await Tags.updateOne(
				{ name: gotTag },
				{
					$inc: {
						count: 1,
						upload_count: 1,
					},
				}
			)

			if (update.matchedCount > 0) {
				// Tag was updated, get its ID
				const tag = await Tags.findOne({ name: gotTag })
				exsistTagIds.push(tag._id)
				tagIds.push(tag._id)
			} else {
				// Tag didn't exist, insert it
				const newTag = await Tags.insertOne({
					name: gotTag,
					count: 1,
					upload_count: 1,
				})
				tagIds.push(newTag.insertedId)
			}
		}

		if (exsistTagIds.length > 0) await updateTagsRelevance(exsistTagIds)

		// if (existing_tags.length > 0) {
		// 	const tagIds = existing_tags.map(
		// 		(id: string) => new mongoose.Types.ObjectId(id)
		// 	)
		// 	tags = [...tags, ...tagIds]

		// 	// Update count and upload_count field for each tag
		// 	await Tags.updateMany(
		// 		{ _id: { $in: tagIds } },
		// 		{
		// 			$inc: {
		// 				count: 1,
		// 				upload_count: 1,
		// 			},
		// 		}
		// 	)

		// 	// Update the relevance scores for the tags
		// 	await updateTagsRelevance(tagIds)
		// }

		// if (new_tags.length > 0) {
		// 	const tagData = new_tags.map((tag: string) => ({
		// 		count: 1,
		// 		upload_count: 1,
		// 		name: tag,
		// 		created_by,
		// 	}))

		// 	const insertedTags = (await Tags.insertMany(tagData, {
		// 		ordered: false,
		// 	})) as Tag[]
		// 	const tagIds = insertedTags.map(tag => tag._id)
		// 	tags = [...tags, ...tagIds]
		// }

		// Update tag co-occurrences if there are multiple tags
		if (tagIds.length > 1) {
			await updateTagCooccurrences(tagIds)
		}

		// Create a new meme entry
		const newMeme = new Meme({
			vote_count: 0,
			name,
			image_url,
			tagIds,
			categories: [],
			created_by: new mongoose.Types.ObjectId(created_by),
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

		// Generate a referral code for the user if they don't have one yet
		await generateReferralCodeIfEligible(created_by)

		await axiosInstance.post('/api/notification', {
			title: 'New meme alert! 🔥',
			message: `🚀 BOOM! New meme dropped: ${name} 😂🔥 Watch now!`,
			type: 'upload',
			notification_for: created_by,
		})

		await milestoneReward(created_by)

		return NextResponse.json({ meme: savedMeme }, { status: 201 })
	} catch (error) {
		console.error('Error:', error)
		return NextResponse.json(
			{ error: error || 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

const majorityRewards = {
	10: 50,
	50: 250,
	100: 650,
	250: 1500,
}

const totalRewards = {
	50: 50,
	100: 150,
	250: 500,
	500: 1000,
}

async function milestoneReward(created_by: string) {
	const memeCount = await Meme.find({
		created_by: created_by,
	}).countDocuments()

	if (memeCount == 1) {
		const milestone = new Milestone({
			milestone: 1,
			reward: 5,
			is_claimed: false,
			created_by: created_by,
			type: 'upload-total',
		})
		await milestone.save()
	}

	const totalMemeCount = await Meme.find({
		vote_by: created_by,
	}).countDocuments()

	if (
		totalMemeCount == 50 ||
		totalMemeCount == 100 ||
		totalMemeCount == 250 ||
		totalMemeCount == 500
	) {
		const found = await Milestone.findOne({
			created_by: created_by,
			milestone: totalMemeCount,
			type: 'upload-total',
		})
		if (found == null) {
			const milestone = new Milestone({
				milestone: totalRewards,
				reward: totalRewards[totalMemeCount],
				is_claimed: false,
				created_by: created_by,
				type: 'upload-total',
			})
			await milestone.save()
		}
	}

	const majorityMemeCount = await Meme.find({
		is_onchain: true,
		vote_by: created_by,
		in_percentile: { $gte: 51 },
	}).countDocuments()

	if (
		majorityMemeCount == 10 ||
		majorityMemeCount == 50 ||
		majorityMemeCount == 100 ||
		majorityMemeCount == 250
	) {
		const found = await Milestone.findOne({
			created_by: created_by,
			milestone: majorityMemeCount,
			type: 'upload',
		})
		if (found == null) {
			const milestone = new Milestone({
				milestone: majorityRewards,
				reward: majorityRewards[majorityMemeCount],
				is_claimed: false,
				created_by: created_by,
				type: 'upload',
			})
			await milestone.save()
		}
	}
}

async function isLimitReached(created_by: string) {
	const startOfDay = new Date()
	startOfDay.setUTCHours(0, 0, 0, 0) // Set to the start of the day (UTC)

	const endOfDay = new Date()
	endOfDay.setUTCHours(23, 59, 59, 999) // Set to the end of the day (UTC)

	const memes = await Meme.find({
		created_by: created_by,
		createdAt: { $gte: startOfDay, $lt: endOfDay },
	})

	if (memes.length >= 20) {
		throw 'Daily upload limit reached'
	}
}

export const GET = handleGetRequest
export const POST = withApiLogging(handlePostRequest, 'Create_Meme')
