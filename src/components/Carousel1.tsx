"use client";

import React, { useRef, useEffect, Dispatch, SetStateAction } from "react";
import {
  StackedCarousel,
  ResponsiveContainer,
} from "react-stacked-center-carousel";
import "./Slide.css";
import { Slide } from "./Slide";
import { LeaderboardMeme } from "@/app/home/leaderboard/page";
import { Meme } from "@/app/home/page";

interface Carousel1Props {
  items: Meme[];
  setIsMemeDetailOpen: (isOpen: boolean) => void;
  active?: number;
  setSelectedMeme: Dispatch<SetStateAction<Meme | undefined | LeaderboardMeme>>;
  bookmark: (id: string, name: string, image_url: string) => void;
  handleShare: (id: string, imageUrl: string) => void;
}

const Carousel1: React.FC<Carousel1Props> = ({
  items,
  setIsMemeDetailOpen,
  setSelectedMeme,
  bookmark,
  handleShare,
}) => {
  const ref = useRef<any | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.goNext();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderSlide = React.useCallback(
    (props: any) => (
      <Slide
        {...props}
        memeDetails={props.data}
        setSelectedMeme={setSelectedMeme}
        setIsMemeDetailOpen={setIsMemeDetailOpen}
        bookmark={bookmark}
        handleShare={handleShare}
      />
    ),
    []
  );

  return (
    <div className="card">
      <div style={{ width: "100%" }}>
        <ResponsiveContainer
          carouselRef={ref}
          render={(parentWidth, carouselRef) => {
            let currentVisibleSlide = 5;
            if (parentWidth <= 900) currentVisibleSlide = 3;
            if (parentWidth <= 450) currentVisibleSlide = 1;
            return (
              <StackedCarousel
                ref={carouselRef}
                slideComponent={renderSlide}
                slideWidth={300}
                carouselWidth={parentWidth}
                height={400}
                data={items}
                currentVisibleSlide={currentVisibleSlide}
                maxVisibleSlide={5}
                disableSwipe
                transitionTime={450}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export default Carousel1;
