// import React from "react";
// import { Canvas, } from "@react-three/fiber";
// import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

// const Earth = () => {
//   // Use the `useGLTF` hook to load the 3D model
//   const Model = () => {
//     const { scene } = useGLTF("/assets/earth.glb");
//     return <primitive object={scene} />;
//   };

//   return (
//     <Canvas
//       camera={{ position: [0, 1, 2], fov: 60 }}
      
//       style={{ height: "40vh", width: "30%" }}
//     >
//       {/* Add lights */}
//       <ambientLight intensity={0.5} />
//       <directionalLight position={[5, 5, 5]} intensity={1} />
      
//       {/* Render the model */}
//       <Model />

//       {/* Add orbit controls for interaction */}
//       <OrbitControls />

//       {/* Add an environment (HDR lighting, optional) */}
//       <Environment preset="sunset" />
//     </Canvas>
//   );
// };


// export default Earth;
