import connectToDatabase from '@/lib/db'
import Meme from '@/models/Meme'
import Tags from '@/models/Tags'
import User from '@/models/User'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import Vote from '@/models/Vote'
import axiosInstance from '@/utils/axiosInstance'
import { checkIsAuthenticated } from '@/utils/authFunctions'
import { uploadToGCS } from '@/config/googleStorage'
import { withApiLogging } from '@/utils/apiLogger'
import { updateTagsRelevance, updateTagCooccurrences } from '@/utils/tagUtils'
import { generateReferralCodeIfEligible } from '@/utils/referralUtils'
import { getToken } from 'next-auth/jwt'
import { 
	MAJORITY_PERCENTILE_THRESHOLD,
	DAILY_LIMITS
} from "@/config/rewardsConfig";
import { processActivityMilestones } from "@/utils/milestoneUtils";

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

		// Get authenticated user if available
		let authenticatedUserId = null
		const token = await getToken({ req })
		if (token && token.address) {
			const user = await User.findOne({ user_wallet_address: token.address })
			if (user) {
				authenticatedUserId = user._id
			}
		}

		// Use either provided userId or authenticated userId
		const effectiveUserId = userId != null && userId != 'undefined' 
			? userId 
			: authenticatedUserId ? authenticatedUserId.toString() : null

		const memesCount = await Meme.find({
			is_voting_close: false,
			is_onchain: false,
		}).countDocuments()

		if (id) {
			// For single meme fetch, check if user has voted for it
			const memeQuery = Meme.findOne().where({ _id: id }).populate('tags')
			
			let meme = await memeQuery.exec()
			
			// If we have a user, check if they've voted for this meme
			if (effectiveUserId && meme) {
				const userObjectId = new mongoose.Types.ObjectId(effectiveUserId)
				const voteExists = await Vote.exists({
					vote_to: meme._id,
					vote_by: userObjectId
				})
				
				// Convert to plain object if it's a Mongoose document
				meme = meme.toObject ? meme.toObject() : meme
				meme.has_user_voted = !!voteExists
				
				// Add bookmark count
				meme.bookmark_count = meme.bookmarks ? meme.bookmarks.length : 0
			}
			
			return NextResponse.json({ meme: meme }, { status: 200 })
		}

		if (vote_by && off) {
			const votedMemesCount = await Vote.where({
				vote_by: vote_by,
			}).countDocuments()

			const memes = await Vote.find()
				.where({ vote_by: vote_by })
				.populate({
					path: 'vote_to',
					populate: [
						{
							path: 'tags',
							model: 'Tags'
						},
						{
							path: 'created_by',
							model: 'User'
						}
					]
				})
				.populate('vote_by')

			// Set vote_count to 0 for memes created today
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			
			memes.forEach(vote => {
				const meme = vote.vote_to;
				if (meme && meme.createdAt) {
					const createdAt = new Date(meme.createdAt)
					if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
						meme.vote_count = 0
					}
				}
			})

			return NextResponse.json(
				{ memes: memes, votedMemesCount: votedMemesCount },
				{ status: 200 }
			)
		}

		if (created_by && off) {
			const memesCount = await Meme.where({
				created_by: created_by,
			}).countDocuments()
			
			// Create base pipeline for user's memes
			const userMemesPipeline: any[] = [
				{ $match: { created_by: new mongoose.Types.ObjectId(created_by) } },
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
			]
			
			// Add user vote check if authenticated
			if (effectiveUserId) {
				const userObjectId = new mongoose.Types.ObjectId(effectiveUserId)
				userMemesPipeline.push(
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
							has_user_voted: { $gt: [{ $size: '$userVote' }, 0] },
							bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } }
						},
					},
					{
						$project: {
							userVote: 0,
						},
					}
				)
			}
			
			const memes = await Meme.aggregate(userMemesPipeline)

			return NextResponse.json(
				{ memes: memes, memesCount: memesCount },
				{ status: 200 }
			)
		}

		if (name) {
			// Split and clean search terms
			const searchTerms = name.split(',')
				.map(term => term.trim())
				.filter(term => term.length > 0)
			
			if (searchTerms.length === 0) {
				return NextResponse.json(
					{ memes: [], memesCount: 0 },
					{ status: 200 }
				)
			}
			
			// Log the search terms for debugging
			console.log('Searching for terms:', searchTerms)
			
			// Create regex patterns for tag search
			const searchPatterns = searchTerms.map(term => {
				// Escape special regex characters to prevent regex injection
				const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
				return new RegExp(escapedTerm, 'i')
			})
			
			// Find matching tag IDs
			const tagIds = await Tags.find({
				name: { $in: searchPatterns }
			}).distinct('_id')
			
			// Find users whose username matches the search terms
			const matchingUserIds = await User.find({
				username: { $in: searchPatterns }
			}).distinct('_id')
			
			// For direct name search, use simple string comparison instead of regex
			// This is more reliable for certain types of content
			const nameSearchConditions = searchTerms.map(term => ({
				name: { $regex: term, $options: 'i' }
			}))
			
			// Create search pipeline with scoring
			const searchPipeline: any[] = [
				{
					$match: {
						$or: [
							// Direct name search
							...nameSearchConditions,
							// Tag search
							{ tags: { $in: tagIds } },
							// Creator username search
							{ created_by: { $in: matchingUserIds } },
						],
						// Don't filter by is_voting_close for search - show all memes
						// is_voting_close: false
					}
				},
				// Add relevance scoring
				{
					$addFields: {
						relevanceScore: {
							$add: [
								// Exact name match gets highest score
								{
									$cond: {
										if: {
											$or: searchTerms.map(term => ({
												$regexMatch: {
													input: "$name",
													regex: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i")
												}
											}))
										},
										then: 100,
										else: 0
									}
								},
								// Name starts with search term gets high score
								{
									$cond: {
										if: {
											$or: searchTerms.map(term => ({
												$regexMatch: {
													input: "$name",
													regex: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i")
												}
											}))
										},
										then: 50,
										else: 0
									}
								},
								// Word in name starts with search term gets medium-high score
								{
									$cond: {
										if: {
											$or: searchTerms.map(term => ({
												$regexMatch: {
													input: "$name",
													regex: new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i")
												}
											}))
										},
										then: 40,
										else: 0
									}
								},
								// Name contains search term gets medium score
								{
									$cond: {
										if: {
											$or: searchTerms.map(term => ({
												$regexMatch: {
													input: "$name",
													regex: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i")
												}
											}))
										},
										then: 25,
										else: 0
									}
								},
								// Tag match gets lower score
								{
									$cond: {
										if: { $gt: [{ $size: { $setIntersection: ["$tags", tagIds] } }, 0] },
										then: 10,
										else: 0
									}
								},
								// Creator username match gets medium score
								{
									$cond: {
										if: { $in: ["$created_by", matchingUserIds] },
										then: 15,
										else: 0
									}
								},
								// Newer memes get a slight boost
								{
									$divide: [
										{ $subtract: ["$createdAt", new Date(0)] },
										86400000 * 30 // Normalize by 30 days
									]
								}
							]
						}
					}
				},
				// Sort by relevance score
				{ $sort: { relevanceScore: -1, createdAt: -1 } },
				// Lookup related data
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
			]
			
			// Add user vote check if authenticated
			if (effectiveUserId) {
				const userObjectId = new mongoose.Types.ObjectId(effectiveUserId)
				searchPipeline.push(
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
							has_user_voted: { $gt: [{ $size: '$userVote' }, 0] },
							bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } }
						},
					},
					{
						$project: {
							userVote: 0,
							relevanceScore: 0 // Remove the scoring field from final results
						},
					}
				)
			} else {
				// Remove the scoring field if no user
				searchPipeline.push(			{
				$addFields: {
					bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } }
				},
				$project: {
					relevanceScore: 0
				}
			})
			}
			
			// Get total count for pagination
			const countPipeline = [
				{
					$match: {
						$or: [
							...nameSearchConditions,
							{ tags: { $in: tagIds } },
							{ created_by: { $in: matchingUserIds } },
						],
						// Don't filter by is_voting_close for search
						// is_voting_close: false
					}
				},
				{ $count: "total" }
			]
			
			// Execute the search and get the results
			const [memes, countResult] = await Promise.all([
				Meme.aggregate(searchPipeline),
				Meme.aggregate(countPipeline)
			])
			
			// Log the number of results found
			console.log(`Found ${memes.length} memes matching search terms`)
			
			// Set vote_count to 0 for memes created today
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			
			memes.forEach(meme => {
				if (meme.createdAt) {
					const createdAt = new Date(meme.createdAt)
					if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
						meme.vote_count = 0
					}
				}
			})
			
			const totalCount = countResult.length > 0 ? countResult[0].total : 0

			return NextResponse.json(
				{ memes: memes, memesCount: totalCount },
				{ status: 200 }
			)
		}

		if (type == 'carousel') {
			// Create carousel pipeline
			const carouselPipeline: any[] = [
				{ $match: { is_onchain: false } },
				{ $sort: { createdAt: -1 } },
				{ $limit: 10 },
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
			]
			
			// Add user vote check if authenticated
			if (effectiveUserId) {
				const userObjectId = new mongoose.Types.ObjectId(effectiveUserId)
				carouselPipeline.push(
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
							has_user_voted: { $gt: [{ $size: '$userVote' }, 0] },
							bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } }
						},
					},
					{
						$project: {
							userVote: 0,
						},
					}
				)
			}
			// Add bookmark count even if no user
			else {
				carouselPipeline.push(
					{
						$addFields: {
							bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } }
						}
					}
				)
			}
			
			const liveMemes = await Meme.aggregate(carouselPipeline)

			// Set vote_count to 0 for memes created today
			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)
			
			liveMemes.forEach(meme => {
				if (meme.createdAt) {
					const createdAt = new Date(meme.createdAt)
					if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
						meme.vote_count = 0
					}
				}
			})

			if (liveMemes.length == 0 || liveMemes.length < 5) {
				// Fallback to get more memes if needed
				const fallbackPipeline = [...carouselPipeline]
				// Remove the is_onchain filter
				fallbackPipeline.splice(0, 1)
				
				const memes = await Meme.aggregate(fallbackPipeline)
				
				// Apply filter for fallback memes too
				memes.forEach(meme => {
					if (meme.createdAt) {
						const createdAt = new Date(meme.createdAt)
						if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
							meme.vote_count = 0
						}
					}
				})
				
				return NextResponse.json(
					{ memes: [...liveMemes, ...memes] },
					{ status: 200 }
				)
			}
			return NextResponse.json({ memes: liveMemes }, { status: 200 })
		}

		const basePipeline: any[] = [
			{ $match: { is_voting_close: false } },
			{ $match: { is_onchain: false } },
			{ $sort: { createdAt: -1 } },
			{ $skip: start },
			{ $limit: defaultOffset },
			{
				$project: {
				vote_count: 0,
				},
			}
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
			},
			{
				$lookup: {
					from: 'bookmarks',
					localField: '_id',
					foreignField: 'meme',
					as: 'bookmarks',
				},
			}
		)

		// If userId is provided or user is authenticated, inject vote check logic
		if (effectiveUserId) {
			const userObjectId = new mongoose.Types.ObjectId(effectiveUserId)
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
						has_user_voted: { $gt: [{ $size: '$userVote' }, 0] },
						bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } } // Count from Bookmark collection lookup
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

		// Set vote_count to 0 for memes created today
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)
		
		memes.forEach(meme => {
			if (meme.createdAt) {
				const createdAt = new Date(meme.createdAt)
				if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
					meme.vote_count = 0
				}
			}
		})

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
		const gotTags = JSON.parse((formData.get('tags') as string) || '[]')

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

		// Convert file to Buffer for upload
		const buffer = Buffer.from(await file.arrayBuffer())

		// Upload to Google Cloud Storage
		const image_url = await uploadToGCS(
			buffer,
			file.name,
			file.type,
			'meme'
		)

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
				created_by,
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

		// Create a new meme entry
		const newMeme = new Meme({
			vote_count: 0,
			name,
			image_url,
			tags,
			categories: [],
			created_by: new mongoose.Types.ObjectId(created_by),
			winning_number: 0,
			in_percentile: 0,
			is_voting_close: false,
			voting_days: 1,
			is_claimed: true,
			is_onchain: false,
			shares: [],
			bookmarks: [],
		})

		const savedMeme = await newMeme.save()

		// Generate a referral code for the user if they don't have one yet
		await generateReferralCodeIfEligible(created_by)

		await axiosInstance.post('/api/notification', {
			title: 'New content alert! 🔥',
			message: `🚀 BOOM! New content dropped: ${name} 😂🔥 Watch now!`,
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

async function milestoneReward(created_by: string) {
	await processActivityMilestones(
		created_by,
		'upload',
		Meme,
		{ created_by }, // Total uploads query
		{ // Majority uploads query
			is_onchain: true,
			created_by,
			in_percentile: { $gte: MAJORITY_PERCENTILE_THRESHOLD }
		}
	);
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

	if (memes.length >= DAILY_LIMITS.UPLOADS) {
		throw 'Daily upload limit reached'
	}
}

export const GET = handleGetRequest
export const POST = withApiLogging(handlePostRequest, 'Create_Meme')