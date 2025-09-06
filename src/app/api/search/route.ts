import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Meme from '@/models/Meme';
import User from '@/models/User';
import { withApiLogging } from '@/utils/apiLogger';

async function handleGetRequest(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || 'meme';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const results: any = {};

        // If type is 'all' or 'meme', search memes
        if (type === 'all' || type === 'meme') {
            const memes = await Meme.aggregate([
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
                    $lookup: {
                        from: 'tags',
                        localField: 'tags',
                        foreignField: '_id',
                        as: 'tagDetails'
                    }
                },
                {
                    $match: {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { 'creator.username': { $regex: query, $options: 'i' } },
                            { 'tagDetails.name': { $regex: query, $options: 'i' } }
                        ]
                    }
                },
                {
                    $addFields: {
                        tags: '$tagDetails'
                    }
                },
                {
                    $project: {
                        tagDetails: 0
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
                        tags: {
                            $map: {
                                input: '$tagDetails',
                                as: 'tag',
                                in: {
                                    _id: '$$tag._id',
                                    name: '$$tag.name',
                                    createdAt: '$$tag.createdAt',
                                    updatedAt: '$$tag.updatedAt',
                                    __v: '$$tag.__v'
                                }
                            }
                        },
                        categories: 1,
                        views: 1
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);
            results.memes = memes;
        }

        // If type is 'all' or 'user', search users
        if (type === 'all' || type === 'user') {
            const users = await User.aggregate([
                {
                    $match: {
                        $or: [
                            { username: { $regex: query, $options: 'i' } },
                            { bio: { $regex: query, $options: 'i' } }
                        ]
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
                        following: { $size: '$following' }
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);
            results.users = users;
        }

        // If type is 'all' or 'tag', search tags
        if (type === 'all' || type === 'tag') {
            const tags = await Meme.aggregate([
                { $unwind: '$tags' },
                {
                    $lookup: {
                        from: 'tags',
                        localField: 'tags',
                        foreignField: '_id',
                        as: 'tagInfo'
                    }
                },
                { $unwind: '$tagInfo' },
                {
                    $match: {
                        'tagInfo.name': { $regex: query, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: '$tagInfo.name',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        name: '$_id',
                        _id: 0
                    }
                }
            ]);
            results.tags = tags.map(tag => tag.name);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        );
    }
}

export const GET = withApiLogging(handleGetRequest, 'Search');