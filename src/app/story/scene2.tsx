"use client";
import React, { useRef, useState } from "react";
import fog from "../../../public/assets/fog.png";
import commode from "../../../public/assets/commode1.png";
import satellite from "../../../public/assets/satellite.png";
import smoke1 from "../../../public/assets/Smoke-2.png";
import smoke2 from "../../../public/assets/Smoke-4.png";
import "./Scene2.css";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  setScene: React.Dispatch<React.SetStateAction<number>>
}

export default function Scene2({ setScene }: Props) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [startVideo, setStartVideo] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isShowAnimation, setShowAnimation] = useState(false);

  return (
    <div>
      <audio ref={audioRef} src="/assets/audios/rain-and-thunder-16705.mp3" />
      {
        !startVideo &&
        <div className="scene-container" onMouseEnter={() => {
          document.body.classList.add("hovered");
        }}>
          <Image width={200} height={500} src={fog.src} alt="fog" className="fog" />
          {
            isLoading ?
              <div className={`loading-bg ${startVideo && "fade-animation"}`}>
                <Image id="loading" height={400} width={400} src={"/assets/loading.gif"} alt="loading" />
                <Image className={`load-smoke1 ${isShowAnimation && "load-smoke1-anim"}`} height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
                <Image className="load-smoke2 load-smoke2-anim" height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
                <Image className="load-smoke3 load-smoke3-anim" height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
                <Image className="load-smoke4 load-smoke4-anim" height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
                <Image className="load-smoke5 load-smoke5-anim" height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
                <Image className="load-smoke6 load-smoke6-anim" height={300} width={300} src={"/assets/load_smoke.png"} alt="loading" />
              </div>
              :
              <motion.div exit={{ opacity: 0 }}>
                <Image unoptimized width={200} height={500} src={commode.src} alt="commode" className="commode" />
                <Image
                  className={`transform-btn animate-pulse hover:scale-105 `}
                  src="/assets/buttons/clicktransform.png"
                  width={200} height={500}
                  alt="launch button"
                />
                <Image width={200} height={500} src={satellite.src} alt="satellite" className="satellite-s2" onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setShowAnimation(true);
                  }, 1000)
                  setTimeout(() => {
                    setStartVideo(true);
                    //@ts-expect-error this is error
                    audioRef.current.play();
                  }, 2000)

                }} />
              </motion.div>
          }
          <Image width={200} height={500} src={smoke1.src} alt="smoke 1" className="smoke-right smoke1" />
          <Image width={200} height={500} src={smoke2.src} alt="smoke 2" className="smoke-left smoke2" />

        </div>
      }
      {
        startVideo ?
          <AnimatePresence>
            <motion.video
              exit={{ opacity: 0 }}
              transition={{ duration: 5 }}
              ref={videoRef}
              preload="none"
              autoPlay
              muted
              onEnded={() => {
                setScene(3);
                //@ts-expect-error this is error
                audioRef.current.pause();

              }}>
              <motion.source src='/assets/scene2-2.mp4' type="video/mp4" />
            </motion.video>
          </AnimatePresence>
          : null

      }
    </div>
  );
}

// scene2-2.mp4
