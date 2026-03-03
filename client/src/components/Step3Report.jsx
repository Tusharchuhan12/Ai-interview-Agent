import React from "react";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

function Step3Report() {
  const navigate = useNavigate();

  const dummyReport = [
    {
      question: "Tell me about yourself?",
      score: 7,
      feedback: "Good introduction but try to add more professional achievements.",
    },
    {
      question: "Explain your project experience.",
      score: 6,
      feedback: "Project explanation is good but needs more technical depth.",
    },
    {
      question: "Why should we hire you?",
      score: 8,
      feedback: "Confidence is good. Answer is structured.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-white shadow px-4 py-2 rounded-lg hover:shadow-md transition"
        >
          <FaHome />
          Home
        </button>

        <h1 className="text-xl font-bold text-gray-800">
          Interview Feedback Report
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-white shadow hover:shadow-md transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>

      </div>

      {/* Feedback Cards */}
      <div className="space-y-5">
        {dummyReport.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-5 space-y-3"
          >
            <p className="text-xs text-gray-400">Question {i + 1}</p>

            <p className="font-semibold text-gray-800">
              {item.question}
            </p>

            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-semibold">
                AI Feedback
              </p>

              <p className="text-sm text-gray-700 mt-1">
                {item.feedback}
              </p>
            </div>

            <div className="text-right font-bold text-green-600 text-sm">
              Score: {item.score}/10
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}

export default Step3Report;