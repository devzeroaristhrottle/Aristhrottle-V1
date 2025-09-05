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

        let results;
        switch (type) {
            case 'meme':
                // Search memes by title, tags, or creator's username
                results = await Meme.aggregate([
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'created_by',
                            foreignField: '_id',
                            as: 'creator'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { name: { $regex: query, $options: 'i' } },
                                { tags: { $regex: query, $options: 'i' } },
                                { 'creator.username': { $regex: query, $options: 'i' } }
                            ]
                        }
                    },
                    { $skip: skip },
                    { $limit: limit }
                ]);
                break;

            case 'user':
                // Search users by username or bio
                results = await User.find({
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { bio: { $regex: query, $options: 'i' } }
                    ]
                })
                .skip(skip)
                .limit(limit)
                .select('-password -email'); // Exclude sensitive fields
                break;

            case 'tag':
                // Search tags and return with usage count
                results = await Meme.aggregate([
                    { $unwind: '$tags' },
                    {
                        $match: {
                            tags: { $regex: query, $options: 'i' }
                        }
                    },
                    {
                        $group: {
                            _id: '$tags',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $skip: skip },
                    { $limit: limit }
                ]);
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid search type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            results,
            page,
            limit,
            type
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        );
    }
}

export const GET = withApiLogging(handleGetRequest, 'Search');