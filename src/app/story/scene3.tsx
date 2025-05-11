import Image from 'next/image'
import satellite from "../../../public/assets/satellite.png";
import React from 'react'
import { motion } from "motion/react";

// type Props = {}

export default function Scene3() {
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Image id="scene3" width={0}
                height={0}
                sizes="100vw"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={"/assets/9xcb4ltp.png"} alt='scene3' />
                
            <motion.img
                initial={{
                    rotateY: 0 // Start with no rotation
                }}
                animate={{
                    rotateY: 360 // Rotate a full circle along the X-axis
                }}
                transition={{
                    duration: 2, // Duration for one full rotation
                    repeat: Infinity, // Infinite rotation
                    ease: "linear" // Smooth continuous rotation
                }}
                style={{
                    position: "absolute",
                    top: "60%",
                    left: "40%",
                    height: "210px",
                    width: "250px"
                }}
                src={satellite.src} alt="satellite" className="" />

            <Image id="coin1" width={100} height={100} src={"/assets/coins/1.png"} alt='coins image' />
            <Image id="coin2" width={100} height={100} src={"/assets/coins/2.png"} alt='coins image' />
            <Image id="coin3" width={100} height={100} src={"/assets/coins/3.png"} alt='coins image' />
            <Image id="coin4" width={100} height={100} src={"/assets/coins/4.png"} alt='coins image' />
            <Image id="coin5" width={100} height={100} src={"/assets/coins/5.png"} alt='coins image' />
            <Image id="coin6" width={100} height={100} src={"/assets/coins/6.png"} alt='coins image' />
            <Image id="coin7" width={100} height={100} src={"/assets/coins/7.png"} alt='coins image' />
        </div>
    )
}