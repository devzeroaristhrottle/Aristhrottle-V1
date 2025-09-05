import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Meme from '@/models/Meme';
import User from '@/models/User';
import { withApiLogging } from '@/utils/apiLogger';

async function handleGetRequest(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type') || 'memes';
        const limit = parseInt(searchParams.get('limit') || '20');

        // Calculate the date range for trending (last 7 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        let results;
        switch (type) {
            case 'tags':
                // Get trending tags with proper tag names
                const tagResults = await Meme.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate }
                        }
                    },
                    { $unwind: '$tags' },
                    {
                        $group: {
                            _id: '$tags',
                            count: { $sum: 1 },
                            totalVotes: { $sum: '$vote_count' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'tags',
                            let: { tagId: { $toObjectId: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$_id', '$$tagId']
                                        }
                                    }
                                }
                            ],
                            as: 'tagInfo'
                        }
                    },
                    {
                        $addFields: {
                            tagInfo: { $arrayElemAt: ['$tagInfo', 0] }
                        }
                    },
                    {
                        $project: {
                            name: '$tagInfo.name',
                            score: { $add: ['$count', '$totalVotes'] }
                        }
                    },
                    { $sort: { score: -1 } },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            name: 1
                        }
                    }
                ]);

                // Transform to simple string array as expected by the frontend
                results = tagResults.map(item => item.name).filter(Boolean);
                break;

            case 'users':
                // Get trending users based on recent activity
                const userResults = await User.aggregate([
                    // First get followers and following counts
                    {
                        $lookup: {
                            from: 'followers',
                            localField: '_id',
                            foreignField: 'following',
                            as: 'followers_data'
                        }
                    },
                    {
                        $lookup: {
                            from: 'followers',
                            localField: '_id',
                            foreignField: 'follower',
                            as: 'following_data'
                        }
                    },
                    {
                        $lookup: {
                            from: 'memes',
                            let: { userId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$created_by', '$$userId'] },
                                                { $gte: ['$createdAt', startDate] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'recent_memes'
                        }
                    },
                    {
                        $addFields: {
                            followers: { $size: '$followers_data' },
                            following: { $size: '$following_data' },
                            recent_activity_score: {
                                $add: [
                                    { $size: '$recent_memes' },
                                    { $sum: '$recent_memes.vote_count' }
                                ]
                            }
                        }
                    },
                    {
                        $sort: { recent_activity_score: -1 }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            profile_pic: { $ifNull: ['$profile_pic', '/assets/profile_pics/coin.png'] },
                            bio: { $ifNull: ['$bio', ''] },
                            followers: { $ifNull: ['$followers', 0] },
                            following: { $ifNull: ['$following', 0] }
                        }
                    }
                ]);

                // Ensure all required fields are present and of correct type
                results = userResults.map(user => ({
                    _id: user._id.toString(),
                    username: user.username,
                    profile_pic: user.profile_pic,
                    bio: user.bio || '',
                    followers: Number(user.followers) || 0,
                    following: Number(user.following) || 0
                }));
                break;

            case 'memes':
                // Get trending memes based on votes and views
                results = await Meme.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate }
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'created_by',
                            foreignField: '_id',
                            as: 'creator'
                        }
                    },
                    {
                        $addFields: {
                            creator: { $arrayElemAt: ['$creator', 0] }
                        }
                    },
                    {
                        $sort: {
                            vote_count: -1,
                            views: -1
                        }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: {
                            name: 1,
                            image_url: 1,
                            vote_count: 1,
                            views: 1,
                            creator: 1,
                            createdAt: 1
                        }
                    }
                ]);
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid trending type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            results,
            type
        });
    } catch (error) {
        console.error('Trending fetch error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}

export const GET = withApiLogging(handleGetRequest, 'Trending');