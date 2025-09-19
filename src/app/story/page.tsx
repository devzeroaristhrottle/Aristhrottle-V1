"use client";
import React, { useState } from 'react';
import './style.css';
import Scene1 from './scene1';
import Scene2 from './scene2';
import Scene3 from './scene3';
import { AnimatePresence, motion } from 'framer-motion';

export default function Page() {
    const [scene, setScene] = useState(1);

    return (
        <div className="bg">
            <AnimatePresence mode="wait">
                {scene === 1 && (
                    <motion.div
                        key="scene1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <Scene1 setScene={setScene} />
                    </motion.div>
                )}

                {scene === 2 && (
                    <motion.div
                        key="scene2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <Scene2 setScene={setScene} />
                    </motion.div>
                )}

                {scene === 3 && (
                    <motion.div
                        key="scene3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <Scene3 />
                    </motion.div>
                )}
               
            </AnimatePresence>
        </div>
    );
}
