import connectToDatabase from '@/lib/db'
import Meme from '@/models/Meme'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import User from '@/models/User'
import mongoose from 'mongoose'
import { PipelineStage } from 'mongoose'

export async function GET(req: NextRequest) {
	await connectToDatabase()

	const query = new URLSearchParams(req.nextUrl.search)
	const off = query.get('offset')
	const daily = query.get('daily')
	const defaultOffset = 30
	const offset = off == null ? defaultOffset : parseInt(off.toString())
	const start = offset <= defaultOffset ? 0 : offset - defaultOffset

	// Get authenticated user if available
	let userId = null
	const token = await getToken({ req })
	if (token && token.address) {
		const user = await User.findOne({ user_wallet_address: token.address })
		if (user) {
			userId = user._id
		}
	}

	try {
		if (daily === 'true') {
			// Daily time window: Yesterday 6 AM IST to Today 6 AM IST
			const now = new Date()
			const today6amIST = new Date(
				Date.UTC(
					now.getUTCFullYear(),
					now.getUTCMonth(),
					now.getUTCDate(),
					0,
					30
				)
			)
			const yesterday6amIST = new Date(
				today6amIST.getTime() - 24 * 60 * 60 * 1000
			)

			// Count total memes
			const memesCount = await Meme.countDocuments({
				is_voting_close: true,
				is_onchain: true,
				createdAt: { $gte: yesterday6amIST, $lte: today6amIST },
			})

			// Max vote count
			const maxVotesResult = await Meme.aggregate([
				{
					$match: {
						is_voting_close: true,
						is_onchain: true,
						createdAt: { $gte: yesterday6amIST, $lte: today6amIST },
					},
				},
				{
					$group: {
						_id: null,
						maxVotes: { $max: { $ifNull: ['$vote_count', 0] } },
					},
				},
			])
			const maxVotes = maxVotesResult[0]?.maxVotes || 0

			// Total vote count
			const totalVotesResult = await Meme.aggregate([
				{
					$match: {
						is_voting_close: true,
						createdAt: { $gte: yesterday6amIST, $lte: today6amIST },
					},
				},
				{
					$group: {
						_id: null,
						totalVotes: { $sum: { $ifNull: ['$vote_count', 0] } },
					},
				},
			])
			const totalVotes = totalVotesResult[0]?.totalVotes || 0

			// Fetch memes with ranking and user info
			const basePipeline: PipelineStage[] = [
				{
					$match: {
						is_voting_close: true,
						is_onchain: true,
						createdAt: { $gte: yesterday6amIST, $lt: today6amIST },
					},
				},
				{ $sort: { vote_count: -1, _id: 1 } },
				{
					$setWindowFields: {
						sortBy: { vote_count: -1 },
						output: {
							rank: { $denseRank: {} },
						},
					},
				},
				{
					$addFields: {
						// Make sure shares and bookmarks fields exist before using $size
						sharesArray: { $ifNull: ['$shares', []] },
						bookmarksArray: { $ifNull: ['$bookmarks', []] },
					}
				},
			]

			// Add user rating lookup if user is authenticated
			if (userId) {
				basePipeline.push({
					$lookup: {
						from: 'voteratings',
						let: { memeId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$meme_id', '$$memeId'] },
											{
												$eq: ['$user_id', new mongoose.Types.ObjectId(userId)],
											},
										],
									},
								},
							},
							{ $limit: 1 },
						],
						as: 'userRating',
					},
				})
				
				// Add lookup to check if user has voted for this meme
				basePipeline.push({
					$lookup: {
						from: 'votes',
						let: { memeId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$vote_to', '$$memeId'] },
											{
												$eq: ['$vote_by', new mongoose.Types.ObjectId(userId)],
											},
										],
									},
								},
							},
							{ $limit: 1 },
						],
						as: 'userVote',
					},
				})
			}

			// Continue with the rest of the pipeline
			basePipeline.push(
				{
					$lookup: {
						from: 'users',
						localField: 'created_by',
						foreignField: '_id',
						as: 'created_by',
					},
				},
				{
					$unwind: {
						path: '$created_by',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: 'tags',
						localField: 'tags',
						foreignField: '_id',
						as: 'tags',
					},
				},
				{
					$addFields: {
						// Calculate derived fields
						share_count: { $size: '$sharesArray' },
						bookmark_count: { $size: '$bookmarksArray' },
						in_percentile: {
							$cond: {
								if: { $gt: [maxVotes, 0] },
								then: {
									$multiply: [
										{
											$divide: [{ $ifNull: ['$vote_count', 0] }, maxVotes],
										},
										100,
									],
								},
								else: 0,
							},
						},
						user_rating: {
							$cond: {
								if: userId && { $isArray: '$userRating' } && { $gt: [{ $size: '$userRating' }, 0] },
								then: { $arrayElemAt: ['$userRating.rating', 0] },
								else: 'none',
							},
						},
						has_user_voted: {
							$cond: {
								if: userId,
								then: { $gt: [{ $size: { $ifNull: ['$userVote', []] } }, 0] },
								else: false,
							},
						},
					}
				},
				{
					$project: {
						_id: 1,
						name: 1,
						vote_count: 1,
						image_url: 1,
						rank: 1,
						createdAt: 1,
						share_count: 1,
						bookmark_count: 1,
						in_percentile: 1,
						'created_by._id': 1,
						'created_by.username': 1,
						'created_by.profile_pic': '$created_by.profile_pic',
						tags: {
							$map: {
								input: '$tags',
								as: 'tag',
								in: '$$tag.name',
							},
						},
						user_rating: 1,
						has_user_voted: 1,
					},
				},
				{ $skip: start }
				//{ $limit: defaultOffset }
			)

			const memes = await Meme.aggregate(basePipeline)

			return NextResponse.json(
				{
					memes,
					memesCount,
					totalVotes,
					totalUpload: memesCount,
				},
				{ status: 200 }
			)
		} else {
			// OLD non-daily logic unchanged
			const memesCount = await Meme.countDocuments({
				is_voting_close: true,
			})

			const maxVotesResult = await Meme.aggregate([
				{
					$match: {
						is_voting_close: true,
					},
				},
				{
					$group: {
						_id: null,
						maxVotes: { $max: { $ifNull: ['$vote_count', 0] } },
					},
				},
			])
			const maxVotes = maxVotesResult[0]?.maxVotes || 0

			const totalVotes = await Meme.aggregate([
				{
					$match: {
						is_voting_close: true,
					},
				},
				{
					$group: {
						_id: null,
						totalVotes: { $sum: '$vote_count' },
					},
				},
			])

			// Create base pipeline
			const basePipeline: PipelineStage[] = [
				{
					$match: { is_voting_close: true },
				},
				{ $sort: { vote_count: -1, _id: 1 } },
				{
					$setWindowFields: {
						sortBy: { vote_count: -1 },
						output: {
							rank: { $denseRank: {} },
						},
					},
				},
				{
					$addFields: {
						// Make sure shares and bookmarks fields exist before using $size
						sharesArray: { $ifNull: ['$shares', []] },
						bookmarksArray: { $ifNull: ['$bookmarks', []] },
					}
				},
			]

			// Add user rating lookup if user is authenticated
			if (userId) {
				basePipeline.push({
					$lookup: {
						from: 'voteratings',
						let: { memeId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$meme_id', '$$memeId'] },
											{
												$eq: ['$user_id', new mongoose.Types.ObjectId(userId)],
											},
										],
									},
								},
							},
							{ $limit: 1 },
						],
						as: 'userRating',
					},
				})
				
				// Add lookup to check if user has voted for this meme
				basePipeline.push({
					$lookup: {
						from: 'votes',
						let: { memeId: '$_id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$vote_to', '$$memeId'] },
											{
												$eq: ['$vote_by', new mongoose.Types.ObjectId(userId)],
											},
										],
									},
								},
							},
							{ $limit: 1 },
						],
						as: 'userVote',
					},
				})
			}

			// Continue with the rest of the pipeline
			basePipeline.push(
				{
					$lookup: {
						from: 'users',
						localField: 'created_by',
						foreignField: '_id',
						as: 'created_by',
					},
				},
				{
					$unwind: {
						path: '$created_by',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: 'tags',
						localField: 'tags',
						foreignField: '_id',
						as: 'tags',
					},
				},
				{
					$addFields: {
						// Calculate derived fields
						share_count: { $size: '$sharesArray' },
						bookmark_count: { $size: '$bookmarksArray' },
						in_percentile: {
							$cond: {
								if: { $gt: [maxVotes, 0] },
								then: {
									$multiply: [
										{
											$divide: [{ $ifNull: ['$vote_count', 0] }, maxVotes],
										},
										100,
									],
								},
								else: 0,
							},
						},
						user_rating: {
							$cond: {
								if: userId && { $isArray: '$userRating' } && { $gt: [{ $size: '$userRating' }, 0] },
								then: { $arrayElemAt: ['$userRating.rating', 0] },
								else: 'none',
							},
						},
						has_user_voted: {
							$cond: {
								if: userId,
								then: { $gt: [{ $size: { $ifNull: ['$userVote', []] } }, 0] },
								else: false,
							},
						},
					}
				},
				{
					$project: {
						_id: 1,
						name: 1,
						vote_count: 1,
						image_url: 1,
						rank: 1,
						createdAt: 1,
						share_count: 1,
						bookmark_count: 1,
						in_percentile: 1,
						'created_by._id': 1,
						'created_by.username': 1,
						'created_by.profile_pic': '$created_by.profile_pic',
						tags: {
							$map: {
								input: '$tags',
								as: 'tag',
								in: '$$tag.name',
							},
						},
						user_rating: 1,
						has_user_voted: 1,
					},
				},
				{ $skip: start }
				//	{ $limit: defaultOffset }
			)

			const memes = await Meme.aggregate(basePipeline)

			return NextResponse.json(
				{
					memes,
					memesCount,
					totalVotes: totalVotes[0]?.totalVotes || 0,
					totalUpload: memesCount,
				},
				{ status: 200 }
			)
		}
	} catch (error) {
		console.error('Error in GET /memes:', error)
		return NextResponse.json(
			{ error: error || 'Internal Server Error' },
			{ status: 500 }
		)
	}
}
