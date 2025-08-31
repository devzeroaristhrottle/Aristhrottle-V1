import { Account, Meme } from "../types"


export const dummyAccounts: Account[] = [
    {
        _id: "1",
        username: "CryptoKing",
        profile_pic: "/assets/coins/1.png",
        bio: "Leading the future of decentralized finance. Building the next generation of blockchain solutions.",
        followers: 15420,
        following: 234
    },
    {
        _id: "2", 
        username: "MemeLord",
        profile_pic: "/assets/coins/2.png",
        bio: "Creating viral memes that make the internet laugh. Meme culture is the future of communication.",
        followers: 12890,
        following: 156
    },
    {
        _id: "3",
        username: "ArtMaster",
        profile_pic: "/assets/coins/3.png", 
        bio: "Digital artist exploring the intersection of technology and creativity. NFTs are just the beginning.",
        followers: 9876,
        following: 89
    },
    {
        _id: "4",
        username: "DigitalArtist",
        profile_pic: "/assets/coins/4.png",
        bio: "Transforming imagination into digital reality. Every pixel tells a story.",
        followers: 7654,
        following: 123
    },
    {
        _id: "5",
        username: "BlockchainBuddy",
        profile_pic: "/assets/coins/5.png",
        bio: "Your friendly guide to blockchain technology. Making crypto accessible to everyone.",
        followers: 6543,
        following: 67
    },
    {
        _id: "6",
        username: "NFTCollector",
        profile_pic: "/assets/coins/6.png",
        bio: "Curating the finest digital art and collectibles. Building the museum of the future.",
        followers: 5432,
        following: 45
    },
    {
        _id: "7",
        username: "Web3Wizard",
        profile_pic: "/assets/coins/7.png",
        bio: "Crafting the decentralized web. Smart contracts are my spells.",
        followers: 4321,
        following: 78
    },
    {
        _id: "8",
        username: "DeFiDude",
        profile_pic: "/assets/coins/1.png",
        bio: "Revolutionizing finance through decentralization. Yield farming is my passion.",
        followers: 3210,
        following: 34
    },
    {
        _id: "9",
        username: "MetaverseMaven",
        profile_pic: "/assets/coins/2.png",
        bio: "Exploring virtual worlds and digital experiences. The metaverse is our new reality.",
        followers: 2109,
        following: 56
    },
    {
        _id: "10",
        username: "TokenTrader",
        profile_pic: "/assets/coins/3.png",
        bio: "Professional crypto trader and market analyst. Timing is everything in this game.",
        followers: 1098,
        following: 23
    }
]

export const dummyTags = ["Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer", "Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer", "Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer"];

export const dummyMemes: Meme[] = [
    {
        _id: "meme1",
        name: "Crypto Moon Mission",
        image_url: "/assets/meme1.jpeg",
        vote_count: 1247,
        is_onchain: true,
        has_user_voted: false,
        bookmarks: [],
        bookmark_count: 89,
        rank: 1,
        created_by: {
            _id: "user1",
            username: "CryptoKing",
            profile_pic: "/assets/coins/coin1.png",
            user_wallet_address: "0x1234...5678",
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
            __v: 0
        },
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        shares: [],
        tags: ["crypto", "moon", "blockchain"],
        categories: ["finance"],
        views: 5678,
        __v: 0
    },
    {
        _id: "meme2",
        name: "NFT HODL Life",
        image_url: "/assets/meme1.jpeg",
        vote_count: 892,
        is_onchain: true,
        has_user_voted: true,
        bookmarks: ["user123"],
        bookmark_count: 156,
        rank: 2,
        created_by: {
            _id: "user2",
            username: "MemeLord",
            profile_pic: "/assets/coins/coin2.png",
            user_wallet_address: "0x8765...4321",
            createdAt: "2024-01-14T15:45:00Z",
            updatedAt: "2024-01-14T15:45:00Z",
            __v: 0
        },
        createdAt: "2024-01-14T15:45:00Z",
        updatedAt: "2024-01-14T15:45:00Z",
        shares: ["user456", "user789"],
        tags: ["nft", "hodl", "diamond-hands"],
        categories: ["art"],
        views: 4321,
        __v: 0
    },
    {
        _id: "meme3",
        name: "DeFi Yield Farming",
        image_url: "/assets/meme1.jpeg",
        vote_count: 654,
        is_onchain: false,
        has_user_voted: false,
        bookmarks: [],
        bookmark_count: 43,
        rank: 3,
        created_by: {
            _id: "user3",
            username: "ArtMaster",
            profile_pic: "/assets/coins/coin3.png",
            user_wallet_address: "0x9876...5432",
            createdAt: "2024-01-13T09:20:00Z",
            updatedAt: "2024-01-13T09:20:00Z",
            __v: 0
        },
        createdAt: "2024-01-13T09:20:00Z",
        updatedAt: "2024-01-13T09:20:00Z",
        shares: ["user111"],
        tags: ["defi", "yield-farming", "liquidity"],
        categories: ["finance"],
        views: 3456,
        __v: 0
    },
    {
        _id: "meme4",
        name: "Web3 Metaverse Dreams",
        image_url: "/assets/meme1.jpeg",
        vote_count: 521,
        is_onchain: true,
        has_user_voted: false,
        bookmarks: ["user222", "user333"],
        bookmark_count: 78,
        rank: 4,
        created_by: {
            _id: "user4",
            username: "DigitalArtist",
            profile_pic: "/assets/coins/coin4.png",
            user_wallet_address: "0x5555...6666",
            createdAt: "2024-01-12T14:15:00Z",
            updatedAt: "2024-01-12T14:15:00Z",
            __v: 0
        },
        createdAt: "2024-01-12T14:15:00Z",
        updatedAt: "2024-01-12T14:15:00Z",
        shares: [],
        tags: ["web3", "metaverse", "virtual-reality"],
        categories: ["technology"],
        views: 2987,
        __v: 0
    },
    {
        _id: "meme5",
        name: "Smart Contract Magic",
        image_url: "/assets/meme1.jpeg",
        vote_count: 398,
        is_onchain: true,
        has_user_voted: true,
        bookmarks: ["user444"],
        bookmark_count: 34,
        rank: 5,
        created_by: {
            _id: "user5",
            username: "BlockchainBuddy",
            profile_pic: "/assets/coins/coin5.png",
            user_wallet_address: "0x7777...8888",
            createdAt: "2024-01-11T11:30:00Z",
            updatedAt: "2024-01-11T11:30:00Z",
            __v: 0
        },
        createdAt: "2024-01-11T11:30:00Z",
        updatedAt: "2024-01-11T11:30:00Z",
        shares: ["user555"],
        tags: ["smart-contracts", "ethereum", "solidity"],
        categories: ["development"],
        views: 2345,
        __v: 0
    },
    {
        _id: "meme6",
        name: "Gas Fee Woes",
        image_url: "/assets/meme1.jpeg",
        vote_count: 287,
        is_onchain: false,
        has_user_voted: false,
        bookmarks: [],
        bookmark_count: 23,
        rank: 6,
        created_by: {
            _id: "user6",
            username: "NFTCollector",
            profile_pic: "/assets/coins/coin6.png",
            user_wallet_address: "0x9999...0000",
            createdAt: "2024-01-10T16:45:00Z",
            updatedAt: "2024-01-10T16:45:00Z",
            __v: 0
        },
        createdAt: "2024-01-10T16:45:00Z",
        updatedAt: "2024-01-10T16:45:00Z",
        shares: [],
        tags: ["gas-fees", "ethereum", "frustration"],
        categories: ["humor"],
        views: 1876,
        __v: 0
    },
    {
        _id: "meme7",
        name: "DAO Governance",
        image_url: "/assets/meme1.jpeg",
        vote_count: 234,
        is_onchain: true,
        has_user_voted: false,
        bookmarks: ["user666"],
        bookmark_count: 19,
        rank: 7,
        created_by: {
            _id: "user7",
            username: "Web3Wizard",
            profile_pic: "/assets/coins/coin7.png",
            user_wallet_address: "0xaaaa...bbbb",
            createdAt: "2024-01-09T13:20:00Z",
            updatedAt: "2024-01-09T13:20:00Z",
            __v: 0
        },
        createdAt: "2024-01-09T13:20:00Z",
        updatedAt: "2024-01-09T13:20:00Z",
        shares: [],
        tags: ["dao", "governance", "voting"],
        categories: ["politics"],
        views: 1654,
        __v: 0
    },
    {
        _id: "meme8",
        name: "Liquidity Pool Dive",
        image_url: "/assets/meme1.jpeg",
        vote_count: 189,
        is_onchain: false,
        has_user_voted: true,
        bookmarks: ["user777", "user888"],
        bookmark_count: 28,
        rank: 8,
        created_by: {
            _id: "user8",
            username: "DeFiDude",
            profile_pic: "/assets/coins/coin1.png",
            user_wallet_address: "0xcccc...dddd",
            createdAt: "2024-01-08T10:10:00Z",
            updatedAt: "2024-01-08T10:10:00Z",
            __v: 0
        },
        createdAt: "2024-01-08T10:10:00Z",
        updatedAt: "2024-01-08T10:10:00Z",
        shares: ["user999"],
        tags: ["liquidity", "amm", "uniswap"],
        categories: ["finance"],
        views: 1432,
        __v: 0
    }
]