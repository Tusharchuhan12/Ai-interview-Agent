import React, { useState, useRef, useEffect } from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight } from 'react-icons/bs'

function Step2Interview({ interviewData, onFinish }) {

  const { interviewId, questions, userName } = interviewData;

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

  /* ---------------- LOAD VOICES ---------------- */

  useEffect(() => {

    const loadVoices = () => {

      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("female")
        );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      const maleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("mark") ||
          v.name.toLowerCase().includes("male")
        );

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

  }, []);

  /* ---------------- SPEAK FUNCTION ---------------- */

  const speakText = (text) => {

    return new Promise((resolve) => {

      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = 0.92;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        setIsAIPlaying(true);
        stopMic();
        videoRef.current?.play();
      };

      utterance.onend = () => {
        videoRef.current?.pause();
        videoRef.current.currentTime = 0;
        setIsAIPlaying(false);

        if (isMicOn) startMic();

        setSubtitle("");
        resolve();
      };

      setSubtitle(text);
      window.speechSynthesis.speak(utterance);
    });
  };

  /* ---------------- FLOW CONTROL ---------------- */

  useEffect(() => {

    if (!selectedVoice) return;

    const runFlow = async () => {

      if (isIntroPhase) {

        await speakText(`Hi ${userName}, it's great to meet you today.`);
        await speakText("I'll ask you a few questions. Let's begin.");

        setIsIntroPhase(false);

      } else if (currentQuestion) {

        await speakText(currentQuestion.question);
      }
    };

    runFlow();

  }, [selectedVoice, isIntroPhase, currentIndex]);

  /* ---------------- TIMER ---------------- */

  useEffect(() => {

    if (isIntroPhase || !currentQuestion) return;

    setTimeLeft(currentQuestion.timeLimit || 60);

    const timer = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(timer);

  }, [currentIndex, isIntroPhase]);

  useEffect(() => {

    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer();
    }

  }, [timeLeft]);

  /* ---------------- SPEECH RECOGNITION ---------------- */

  useEffect(() => {

    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {

      const transcript =
        event.results[event.results.length - 1][0].transcript;

      setAnswer(prev => prev + " " + transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognition.abort();
      window.speechSynthesis.cancel();
    };

  }, []);

  const startMic = () => {
    if (recognitionRef.current && !isAIPlaying) {
      try { recognitionRef.current.start(); } catch { }
    }
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
  };

  const toggleMic = () => {
    if (isMicOn) stopMic();
    else startMic();

    setIsMicOn(!isMicOn);
  };

  /* ---------------- SUBMIT ANSWER ---------------- */

  const submitAnswer = async () => {

    if (isSubmitting || isAIPlaying) return;

    stopMic();
    setIsSubmitting(true);

    try {

      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken: currentQuestion.timeLimit - timeLeft,
        },
        { withCredentials: true }
      );

      const aiFeedback = result?.data?.feedback || "Good attempt!";
      setFeedback(aiFeedback);

      await speakText(aiFeedback);

    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- NEXT QUESTION ---------------- */

  const handleNext = async () => {

    setAnswer("");
    setFeedback("");

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("Alright, let's move to the next question.");

    setCurrentIndex(prev => prev + 1);
  };

  /* ---------------- FINISH ---------------- */

  const finishInterview = async () => {

    stopMic();
    setIsMicOn(false);

    try {

      const result = await axios.post(
        ServerUrl + "/api/interview/finish",
        { interviewId },
        { withCredentials: true }
      );

      onFinish(result.data);

    } catch (error) {
      console.log(error);
    }
  };

  /* ---------------- UI ---------------- */

  return (

    <div className='min-h-screen flex items-center justify-center p-3 sm:p-6 bg-gray-100'>

      <div className='w-full max-w-7xl bg-white rounded-2xl sm:rounded-3xl shadow-xl flex flex-col lg:flex-row overflow-hidden'>

        {/* LEFT SECTION */}
        <div className='w-full lg:w-1/3 p-4 sm:p-6 border-b lg:border-r'>

          <video
            src={videoSource}
            ref={videoRef}
            muted
            playsInline
            className='rounded-xl w-full h-auto'
          />

          {subtitle && (
            <div className='mt-4 p-3 bg-gray-100 rounded-xl text-center text-sm sm:text-base'>
              {subtitle}
            </div>
          )}

          <Timer
            timeLeft={timeLeft}
            totalTime={currentQuestion?.timeLimit}
          />

        </div>

        {/* RIGHT SECTION */}
        <div className='flex-1 p-4 sm:p-6 md:p-8 flex flex-col min-h-[500px]'>

          {!isIntroPhase && (
            <div className='mb-4 font-semibold text-base sm:text-lg'>
              {currentQuestion?.question}
            </div>
          )}

          <textarea
            className='flex-1 border p-3 sm:p-4 rounded-xl text-sm sm:text-base resize-none min-h-[180px]'
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {!feedback || feedback.trim() === "" ? (

            <div className='flex flex-col sm:flex-row gap-4 mt-6'>

              <button
                onClick={toggleMic}
                className='p-4 bg-black text-white rounded-full self-center sm:self-auto'
              >
                {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>

              <button
                onClick={submitAnswer}
                disabled={isSubmitting || isAIPlaying}
                className='flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm sm:text-base'
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </button>

            </div>

          ) : (

            <div className='mt-6 p-4 bg-emerald-50 rounded-xl text-sm sm:text-base'>

              <p className='mb-4'>{feedback}</p>

              <button
                onClick={handleNext}
                className='w-full bg-emerald-600 text-white py-3 rounded-xl flex justify-center items-center gap-2 text-sm sm:text-base'
              >
                Next Question <BsArrowRight />
              </button>

            </div>

          )}

        </div>
      </div>
    </div>
  );
}

export default Step2Interview;