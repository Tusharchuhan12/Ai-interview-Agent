import React, { useEffect, useRef } from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";

function Auth({ isModel = false, onClose }) {

    const modalRef = useRef();

    // Outside Click Close
    useEffect(() => {
        function handleClickOutside(e) {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose && onClose();
            }
        }

        if (isModel) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, [isModel, onClose]);

    // ESC Key Close
    useEffect(() => {
        function handleEsc(e) {
            if (e.key === "Escape") {
                onClose && onClose();
            }
        }

        if (isModel) {
            window.addEventListener("keydown", handleEsc);
        }

        return () => window.removeEventListener("keydown", handleEsc);

    }, [isModel, onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200 relative text-center"
            >

                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center 
                        rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600 hover:text-black"
                    >
                        ✕
                    </button>
                )}

                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="bg-black text-white p-2 rounded-lg">
                        <BsRobot size={18} />
                    </div>
                    <h2 className="font-semibold text-lg">InterviewIQ.AI</h2>
                </div>

                <h1 className="text-xl md:text-2xl font-semibold leading-snug mb-4">
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2">
                        <IoSparkles size={16} />
                        AI Smart Interview Assistant
                    </span>
                </h1>

                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Practice realistic AI-driven mock interviews.
                    Improve your confidence with adaptive question generation,
                    voice-based answering, and smart performance analysis.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 space-y-2">
                    <p>✨ Multi-level interview simulation</p>
                    <p>🎯 Industry-style technical questioning</p>
                    <p>🧠 Smart answer evaluation</p>
                    <p>📊 Performance feedback insights</p>
                </div>

            </motion.div>
        </div>
    );
}

export default Auth;