"use client"

//New Code with Smooth Scroll 

import Image from "next/image";
import { useRef , useState } from "react";
import Secondpage from "./Secondpage"; // Ensure the correct path to Secondpage



const Homepage = () => {
  // Reference to the second page for smooth scrolling
  const secondPageRef = useRef<HTMLDivElement | null>(null);

 const [showScroll, setShowScroll] = useState(false); // Track whether to show the scroll

  // Function to scroll to the second page
  const scrollToSecondPage = () => {
    if (secondPageRef.current) {
      secondPageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  // Handle meteor click
  const handleMeteorClick = () => {
    setShowScroll(true); // Trigger scroll animation
  };

  return (
    <div style={{ scrollBehavior: "smooth" }}>
      {/* First section - Homepage */}
      <div style={{ height: "100vh", position: "relative", overflow: "hidden" }}>

    
       {/* Static logo  */}
           <Image
          src="/assets/Aristhrottle-static-logo.png"
          width={400}
          height={800}
          alt="Galaxy image"
          style={{
            position: "absolute",
            top: "100px",
            left: "1200px",
            zIndex: 1,
          }}
        />
          {/* Added 'O' ring over the static logo  */}
           <Image
          src="/assets/Logo-ring.gif"
          width={60}
          height={800}
          alt="Galaxy image"
          style={{
            position: "absolute",
            top: "115px",
            left: "1460px",
            zIndex: 1,
          }}
        />
           
       
       
        {/* Background Galaxy Image */}
        <Image
          src="/assets/milkyway-galaxy.png"
          width={700}
          height={800}
          alt="Galaxy image"
        />
    
        {/* Earth Rotating Image */}
        <Image
          src="/assets/Earth-Rotating.gif"
          width={200}
          height={200}
          alt="Earth PNG"
          style={{
            position: "absolute",
            top: "100px",
            left: "600px",
            zIndex: 1,
          }}
        />

        {/* White Galaxy Gif */}
        <Image
          src="/assets/galaxy.gif"
          width={990}
          height={468}
          alt="white galaxy gif"
          style={{
            position: "absolute",
            top: "120px",
            bottom: "20px",
            right: "180px",
            transform: "rotate(138deg)",
          }}
        />

<div style={{ position: "relative", height: "100vh" }}>
      {/* Meteor Cluster Container */}
      <div style={{ position: "absolute", top: "60px", left: "250px",}}>
        <div style={{ position: "relative", width: "200px", height: "200px" }}>
          {/* Individual Meteor Images */}
          <Image
          key="meteor-1"
            src="/assets/Top-meteor.png"
            width={50}
            height={50}
            alt="Meteor 1"
            style={{
              position: "absolute",
              top: "40%",
              left: "45%",
              transform: "rotate(10deg)",
              animation: "shake1 0.95s ease-in-out infinite alternate",
              cursor: "pointer",
            }}
            onClick={handleMeteorClick} // Handle click
          />
          <Image
            key="meteor-2"
            src="/assets/Right-meteor.png"
            width={60}
            height={60}
            alt="Meteor 2"
            style={{
              position: "absolute",
              top: "45%",
              left: "60%",
              transform: "rotate(-20deg)",
              animation: "shake2 0.95s ease-in-out infinite alternate",
              cursor: "pointer",
            }}
            onClick={handleMeteorClick}
          />
          <Image
          key="meteor-3"
            src="/assets/Big-meteor.png"
            width={60}
            height={45}
            alt="Meteor 3"
            style={{
              position: "absolute",
              top: "35%",
              left: "70%",
              transform: "rotate(30deg)",
              animation: "shake3 0.95s ease-in-out infinite alternate",
              cursor: "pointer",
            }}
            onClick={handleMeteorClick}
          />
          <Image
          key="meteor-4"
            src="/assets/Bottom-meteor.png"
            width={45}
            height={45}
            alt="Meteor 4"
            style={{
              position: "absolute",
              top: "25%",
              left: "70%",
              transform: "rotate(30deg)",
              animation: "shake4 0.95s ease-in-out infinite alternate",
              cursor: "pointer",
            }}
            onClick={handleMeteorClick}
          />
          <Image
          key="meteor-5"
            src="/assets/Left-meteor.png"
            width={45}
            height={45}
            alt="Meteor 5"
            style={{
              position: "absolute",
              top: "25%",
              left: "50%",
              transform: "rotate(30deg)",
              animation: "shake5 0.95s ease-in-out infinite alternate",
              cursor: "pointer",
            }}
            onClick={handleMeteorClick}
          />

          {/* Scroll Letter Image */}
          {showScroll && (
            <Image
              src="/assets/Open-scroll.png" // Open Scroll Image
              width={900}
              height={800}
              alt="Open Scroll"
              style={{
                position: "absolute",
                top: "45%", // Adjust as needed
                left: "65%",
                transform: "translate(-50%, -50%) scale(0.5)", // Match the initial scale in keyframes
                animation: "zoomInScroll 2.5s ease-out forwards", // Use the new animation
                zIndex: 10,
              }}
            />
          )}
        </div>
      </div>
      </div>

        {/* Scroll Button */}
        <button
          onClick={scrollToSecondPage}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "1%",
            transform: "translateX(-50%)",
            padding: "12px 28px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffffff",
            background: "linear-gradient(135deg, #ff7e5f, #feb47b)", // Warm gradient
            border: "none",
            borderRadius: "30px", // Rounded corners
            cursor: "pointer",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle shadow for depth
            transition: "transform 0.3s ease, box-shadow 0.3s ease", // Smooth hover transition
          }}
        >
          ⬇
        </button>
      </div>

      {/* Second section - Secondpage */}
      <div ref={secondPageRef} id="secondPage" style={{ height: "100vh" }}>
        <Secondpage />
      </div>

      {/* CSS for Shake Animations */}
      <style jsx>{`
        /* Shake animation keyframes with slight differences */
        @keyframes shake1 {
          0% { transform: translate(0, 0) rotate(10deg); }
          25% { transform: translate(1px, -1px) rotate(10deg); }
          50% { transform: translate(-1px, 1px) rotate(10deg); }
          75% { transform: translate(1px, 1px) rotate(10deg); }
          100% { transform: translate(-1px, -1px) rotate(10deg); }
        }
        @keyframes shake2 {
          0% { transform: translate(0, 0) rotate(-20deg); }
          25% { transform: translate(-1px, 1px) rotate(-20deg); }
          50% { transform: translate(1px, -1px) rotate(-20deg); }
          75% { transform: translate(-1px, -1px) rotate(-20deg); }
          100% { transform: translate(1px, 1px) rotate(-20deg); }
        }
        @keyframes shake3 {
          0% { transform: translate(0, 0) rotate(30deg); }
          25% { transform: translate(1px, -1px) rotate(30deg); }
          50% { transform: translate(-1px, 1px) rotate(30deg); }
          75% { transform: translate(1px, 1px) rotate(30deg); }
          100% { transform: translate(-1px, -1px) rotate(30deg); }
        }
        @keyframes shake4 {
          0% { transform: translate(0, 0) rotate(30deg); }
          25% { transform: translate(-1px, -1px) rotate(30deg); }
          50% { transform: translate(1px, 1px) rotate(30deg); }
          75% { transform: translate(-1px, 1px) rotate(30deg); }
          100% { transform: translate(1px, -1px) rotate(30deg); }
        }
        @keyframes shake5 {
          0% { transform: translate(0, 0) rotate(30deg); }
          25% { transform: translate(1px, 1px) rotate(30deg); }
          50% { transform: translate(-1px, -1px) rotate(30deg); }
          75% { transform: translate(1px, -1px) rotate(30deg); }
          100% { transform: translate(-1px, 1px) rotate(30deg); }
        }
 /* Zoom In Animation for Scroll Image */
        @keyframes zoomInScroll {
  0% {
    transform: translate(-50%, -50%) scale(0.5); /* Start small */
    opacity: 0; /* Start invisible */
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1); /* Slight overshoot for effect */
    opacity: 1; /* Fully visible */
  }
  100% {
    transform: translate(-50%, -50%) scale(1); /* Settle into final size */
  }
}


      `}</style>
    </div>
  );
};

export default Homepage;



