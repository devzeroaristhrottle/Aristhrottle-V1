import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Meme from '@/models/Meme';
import User from '@/models/User';
import Tags from '@/models/Tags';
import { withApiLogging } from '@/utils/apiLogger';
import { getToken } from 'next-auth/jwt';

async function handleGetRequest(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type') || 'all';
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get authenticated user from token for personalized recommendations
        const token = await getToken({ req });
        const userId = token?.address ? 
            (await User.findOne({ user_wallet_address: token.address }))?.id : 
            null;

        let results: any = {};

        // If type is 'all' or 'tags', get recommended tags
        if (type === 'all' || type === 'tags') {
            // Get popular tags weighted by recent activity
            const recommendedTags = await Tags.aggregate([
                {
                    $lookup: {
                        from: 'memes',
                        localField: '_id',
                        foreignField: 'tags',
                        as: 'memes'
                    }
                },
                {
                    $project: {
                        name: 1,
                        count: { $size: '$memes' },
                        recentCount: {
                            $size: {
                                $filter: {
                                    input: '$memes',
                                    as: 'meme',
                                    cond: {
                                        $gte: ['$$meme.createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        score: {
                            $add: [
                                '$count',
                                { $multiply: ['$recentCount', 2] } // Give more weight to recent activity
                            ]
                        }
                    }
                },
                { $sort: { score: -1 } },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        _id: 0
                    }
                }
            ]);
            results.tags = recommendedTags.map(tag => tag.name);
        }

        // If type is 'all' or 'users', get recommended users
        if (type === 'all' || type === 'users') {
            // Get active users with good engagement
            const recommendedUsers = await User.aggregate([
                {
                    $lookup: {
                        from: 'memes',
                        localField: '_id',
                        foreignField: 'created_by',
                        as: 'memes'
                    }
                },
                {
                    $lookup: {
                        from: 'followers',
                        localField: '_id',
                        foreignField: 'following',
                        as: 'followers'
                    }
                },
                {
                    $lookup: {
                        from: 'followers',
                        localField: '_id',
                        foreignField: 'follower',
                        as: 'following'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        profile_pic: 1,
                        bio: { $ifNull: ['$bio', ''] },
                        followers: { $size: '$followers' },
                        following: { $size: '$following' },
                        memeCount: { $size: '$memes' },
                        totalVotes: {
                            $reduce: {
                                input: '$memes',
                                initialValue: 0,
                                in: { $add: ['$$value', '$$this.vote_count'] }
                            }
                        }
                    }
                },
                {
                    $match: {
                        memeCount: { $gt: 0 } // Only users who have posted memes
                    }
                },
                {
                    $addFields: {
                        score: {
                            $divide: ['$totalVotes', '$memeCount']
                        }
                    }
                },
                { $sort: { score: -1 } },
                { $limit: limit }
            ]);
            results.users = recommendedUsers;
        }

        // If type is 'all' or 'memes', get recommended memes
        if (type === 'all' || type === 'memes') {
            // Get popular memes from the last week
            const recommendedMemes = await Meme.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
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
                { $unwind: '$creator' },
                {
                    $addFields: {
                        score: {
                            $add: [
                                '$vote_count',
                                { $multiply: ['$comment_count', 2] } // Comments weighted more than votes
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        image_url: 1,
                        vote_count: 1,
                        is_onchain: 1,
                        bookmarks: 1,
                        bookmark_count: 1,
                        created_by: {
                            _id: '$creator._id',
                            username: '$creator.username',
                            profile_pic: '$creator.profile_pic',
                            user_wallet_address: '$creator.user_wallet_address',
                            createdAt: '$creator.createdAt',
                            updatedAt: '$creator.updatedAt'
                        },
                        createdAt: 1,
                        updatedAt: 1,
                        shares: 1,
                        tags: 1,
                        categories: 1,
                        views: 1
                    }
                },
                { $sort: { score: -1 } },
                { $limit: limit }
            ]);
            results.memes = recommendedMemes;
        }

        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recommendations' },
            { status: 500 }
        );
    }
}

export const GET = withApiLogging(handleGetRequest, 'Recommendations');
