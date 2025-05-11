"use client";
import Image from 'next/image';
import React, { useRef, useState } from 'react'
import Typewriter from 'typewriter-effect';
import { AnimatePresence, motion } from "motion/react"
import "./Scene1.css";

interface Props {
    setScene: React.Dispatch<React.SetStateAction<number>>
}

export default function Scene1({ setScene }: Props) {

    const [clickAnim, setClickAnim] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const videoRef = useRef(null);
    // const [fadeClass, setFadeClass] = useState("");

    const audioRef = useRef(null);
    const typeWriteAudioRef = useRef(null);

    const playAudio = async () => {
        try {
            //@ts-expect-error this is error
            audioRef.current.currentTime = 8;
            //@ts-expect-error this is error
            await audioRef.current.play();
        } catch (error) {
            console.error("Autoplay failed:", error);
        }
    };

    // useEffect(() => {

    //     playAudio();
    // }, []);

    return (
        <motion.div key="box" exit={{ opacity: 0 }}>
            <audio ref={audioRef} src="/assets/audios/alien-ship-takeoff-28339.mp3" />
            <audio ref={typeWriteAudioRef} src="/assets/audios/two-typewriting-machines-background-noise-105411.mp3" />
            <AnimatePresence>
                <motion.img
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 0.8 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    src="/assets/Aristhrottle-static-logo.png"
                    style={{
                        position: "absolute",
                        top: "50px",
                        right: "5%",
                        zIndex: 1,
                    }}
                />
            </AnimatePresence>

            <video id="earth" preload="none" ref={videoRef} autoPlay muted loop>
                <source src='/assets/v5.mp4' type="video/mp4" />
            </video>
            <video style={{ height: "500px" }} className='absolute -right-10 -bottom-10' preload="none" ref={videoRef} autoPlay muted loop>
                <source src='/assets/g1.mp4' type="video/mp4" />
            </video>
            <Image
                className={`satellite ${clickAnim && "goto-animation"}`}
                src="/assets/satellite.png"
                width={300}
                height={700}
                alt="Galaxy image"
                onClick={() => {
                    playAudio();
                    setClickAnim(true)
                    setTimeout(() => {
                        setShowMessage(true);
                        //@ts-expect-error this is error
                        typeWriteAudioRef.current.play();
                        setTimeout(() => {
                            setScene(2);
                        }, 4000)

                    }, 4000)

                }}
            />
            {
                !clickAnim &&
                <Image
                    className={`launch-btn animate-pulse hover:scale-105 `}
                    src="/assets/buttons/launch.png"
                    width={200}
                    height={500}
                    alt="launch button"
                />
            }

            {
                showMessage &&
                <div className="image-sequence">
                    <Typewriter
                        options={{
                            strings: ['"Mission Accomplished! 🌍🚀'],
                            autoStart: true,
                        }}
                    />
                </div>
            }
        </motion.div>
    )
}