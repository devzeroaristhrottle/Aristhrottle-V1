import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import { Account } from '../types'

function SelfView() {
    // 10 dummy accounts based on Account interface
    const dummyAccounts: Account[] = [
        {
            _id: "1",
            username: "CryptoKing",
            profile_pic: "/assets/coins/coin1.png",
            bio: "Leading the future of decentralized finance. Building the next generation of blockchain solutions.",
            followers: 15420,
            following: 234
        },
        {
            _id: "2", 
            username: "MemeLord",
            profile_pic: "/assets/coins/coin2.png",
            bio: "Creating viral memes that make the internet laugh. Meme culture is the future of communication.",
            followers: 12890,
            following: 156
        },
        {
            _id: "3",
            username: "ArtMaster",
            profile_pic: "/assets/coins/coin3.png", 
            bio: "Digital artist exploring the intersection of technology and creativity. NFTs are just the beginning.",
            followers: 9876,
            following: 89
        },
        {
            _id: "4",
            username: "DigitalArtist",
            profile_pic: "/assets/coins/coin4.png",
            bio: "Transforming imagination into digital reality. Every pixel tells a story.",
            followers: 7654,
            following: 123
        },
        {
            _id: "5",
            username: "BlockchainBuddy",
            profile_pic: "/assets/coins/coin5.png",
            bio: "Your friendly guide to blockchain technology. Making crypto accessible to everyone.",
            followers: 6543,
            following: 67
        },
        {
            _id: "6",
            username: "NFTCollector",
            profile_pic: "/assets/coins/coin6.png",
            bio: "Curating the finest digital art and collectibles. Building the museum of the future.",
            followers: 5432,
            following: 45
        },
        {
            _id: "7",
            username: "Web3Wizard",
            profile_pic: "/assets/coins/coin7.png",
            bio: "Crafting the decentralized web. Smart contracts are my spells.",
            followers: 4321,
            following: 78
        },
        {
            _id: "8",
            username: "DeFiDude",
            profile_pic: "/assets/coins/coin1.png",
            bio: "Revolutionizing finance through decentralization. Yield farming is my passion.",
            followers: 3210,
            following: 34
        },
        {
            _id: "9",
            username: "MetaverseMaven",
            profile_pic: "/assets/coins/coin2.png",
            bio: "Exploring virtual worlds and digital experiences. The metaverse is our new reality.",
            followers: 2109,
            following: 56
        },
        {
            _id: "10",
            username: "TokenTrader",
            profile_pic: "/assets/coins/coin3.png",
            bio: "Professional crypto trader and market analyst. Timing is everything in this game.",
            followers: 1098,
            following: 23
        }
    ]

    return (
        <div>
            <div>Tags</div>
            <Tags tags={["Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer", "Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer", "Addiction", "Raytrace", "Social Media", "Artface", "Humanity", "Singing", "Influencer"]} />

            <div>Suggested Accounts</div>
            <Accounts accounts={dummyAccounts} />
        </div>
    )
}

export default SelfView