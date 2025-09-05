import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Meme from '@/models/Meme';
import User from '@/models/User';
import { withApiLogging } from '@/utils/apiLogger';

async function handleGetRequest(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type') || 'tags';
        const limit = parseInt(searchParams.get('limit') || '20');

        let results;
        switch (type) {
            case 'tags':
                // Get popular tags with proper tag names
                results = await Meme.aggregate([
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
                results = results.map(item => item.name).filter(Boolean);
                break;

            case 'users':
                // Get popular users based on followers and content performance
                const userResults = await User.aggregate([
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
                        $addFields: {
                            followers: { $size: '$followers_data' },
                            following: { $size: '$following_data' }
                        }
                    },
                    {
                        $sort: { followers: -1 }
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

            default:
                return NextResponse.json(
                    { error: 'Invalid popular type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            results,
            type
        });
    } catch (error) {
        console.error('Popular fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch popular content' },
            { status: 500 }
        );
    }
}

export const GET = withApiLogging(handleGetRequest, 'Popular');