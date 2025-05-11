"use client"
import Image from "next/image";
import { useState } from "react";

const Secondpage = () => {
  const [showSmoke, setShowSmoke] = useState(true);

  const handleMouseEnter = () => {
    setShowSmoke(false);
  };

  const handleMouseLeave = () => {
    setShowSmoke(true);
  };

  return (
    <div
      style={{

      }
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div id="secondPage" style={{ position: "relative", width: "100%", height: "100vh", }}>
        {/* Smoke Image */}
        <Image
          src="/assets/Full-Screen-Smoke-1.png"
          width={800}
          height={800}
          alt="Smoke image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: showSmoke ? 1 : 0, // Fades out when showSmoke is false
            transition: "opacity 2s ease-in-out", // Smooth fade transition
            position: "absolute", // Overlaps commode image
          
          }}
        />

        {/* Commode Image */}
        <Image
          src="/assets/Commode-2.png"
          width={800}
          height={800}
          alt="Commode image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 1,
            zIndex: 1, // Places commode image above smoke image
          }}
        />
      </div>
    </div>
  );
};

export default Secondpage;

