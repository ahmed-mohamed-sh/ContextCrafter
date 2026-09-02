"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AnalysisStep {
  label: string;
  icon?: string;
}

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  steps: AnalysisStep[];
  assetLabel?: string;
  assetCount?: string;
  progressPercent?: number; // Optional controlled progress, otherwise automatically animated
}

export function AnalysisModal({
  isOpen,
  title,
  description,
  steps,
  assetLabel = "Found Assets",
  assetCount,
  progressPercent,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoProgress, setAutoProgress] = useState(12);

  // Automatically advance steps and progress percentage smoothly while open
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setAutoProgress(12);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    const progressInterval = setInterval(() => {
      setAutoProgress((prev) => {
        if (prev < 92) {
          return prev + Math.floor(Math.random() * 6) + 3;
        }
        return prev;
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, steps.length]);

  const displayProgress = progressPercent ?? autoProgress;
  // Circumference of circle with r=45: 2 * Math.PI * 45 ≈ 282.74
  const circumference = 283;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          style={{
            backgroundColor: "rgba(11, 19, 38, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Radial Gradient Glow & Concentric Rings */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at center, rgba(79, 70, 229, 0.2) 0%, rgba(11, 19, 38, 0) 70%)",
            }}
          >
            <div className="w-[850px] h-[850px] rounded-full border border-white/5 opacity-50 absolute" />
            <div className="w-[620px] h-[620px] rounded-full border border-white/5 opacity-50 absolute" />
            <div className="w-[420px] h-[420px] rounded-full border border-white/5 opacity-50 absolute" />
          </div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-20"
          >
            {/* Left Column: Circular Progress & Title */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="relative w-60 h-60 md:w-72 md:h-72 mb-6 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg
                  className="absolute inset-0 w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#222a3d"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#c3c0ff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      transition: "stroke-dashoffset 0.4s ease-out",
                    }}
                  />
                </svg>

                {/* Inner Glow Core */}
                <div
                  className="w-44 h-44 md:w-52 md:h-52 rounded-full flex flex-col items-center justify-center relative shadow-2xl"
                  style={{
                    backgroundColor: "rgba(23, 31, 51, 0.65)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 0 35px rgba(195, 192, 255, 0.2)",
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-[#c3c0ff]/5 blur-xl pointer-events-none animate-pulse" />
                  <span
                    className="relative z-10"
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 42,
                      fontWeight: 700,
                      color: "#c3c0ff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {Math.min(100, displayProgress)}%
                  </span>
                  <span
                    className="relative z-10 uppercase tracking-widest mt-1"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#c7c4d8",
                    }}
                  >
                    Analysis
                  </span>
                </div>
              </div>

              <h1
                className="mb-3"
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#dae2fd",
                  lineHeight: "34px",
                }}
              >
                {title}
              </h1>
              <p
                className="max-w-md mx-auto"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: "22px",
                  color: "#918fa1",
                }}
              >
                {description}
              </p>
            </div>

            {/* Right Column: Steps Timeline & Discovered Assets */}
            <div className="flex-1 w-full max-w-md flex flex-col gap-4">
              {/* Steps Card */}
              <div
                className="rounded-xl p-6 shadow-2xl flex flex-col gap-5 relative"
                style={{
                  backgroundColor: "rgba(11, 19, 38, 0.65)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                }}
              >
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isInProgress = index === currentStepIndex;
                  const isPending = index > currentStepIndex;

                  return (
                    <div key={step.label} className="flex items-center gap-4 relative">
                      {/* Connection Line connecting to the next step */}
                      {index < steps.length - 1 && (
                        <div
                          className="absolute left-4 top-8 bottom-[-20px] w-px"
                          style={{
                            backgroundColor: isCompleted
                              ? "rgba(195, 192, 255, 0.4)"
                              : "rgba(255, 255, 255, 0.08)",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          isCompleted
                            ? "bg-[#c3c0ff]/15 border border-[#c3c0ff]/30 text-[#c3c0ff]"
                            : isInProgress
                            ? "bg-[#2d3449] border border-[#c3c0ff] text-[#c3c0ff] shadow-[0_0_15px_rgba(195,192,255,0.4)]"
                            : "bg-[#171f33] border border-white/10 text-[#464555]"
                        }`}
                      >
                        {isCompleted ? (
                          <span
                            className="material-symbols-outlined text-[16px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : isInProgress ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            sync
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">
                            {step.icon || "radio_button_unchecked"}
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 13,
                            color: isPending ? "#918fa1" : "#dae2fd",
                          }}
                        >
                          {step.label}
                        </p>
                      </div>

                      {/* Badge */}
                      <div>
                        {isCompleted && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide"
                            style={{
                              backgroundColor: "rgba(195, 192, 255, 0.12)",
                              color: "#c3c0ff",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Completed
                          </span>
                        )}
                        {isInProgress && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide animate-pulse"
                            style={{
                              backgroundColor: "#2d3449",
                              color: "#c7c4d8",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            In Progress
                          </span>
                        )}
                        {isPending && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{
                              color: "#464555",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Found Assets Glass Card */}
              {assetCount && (
                <div
                  className="rounded-xl p-4 flex items-center gap-4 relative overflow-hidden transition-colors"
                  style={{
                    backgroundColor: "rgba(11, 19, 38, 0.5)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "rgba(0, 106, 124, 0.3)",
                      border: "1px solid rgba(76, 215, 246, 0.25)",
                      color: "#4cd7f6",
                    }}
                  >
                    <span className="material-symbols-outlined">category</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#918fa1",
                      }}
                    >
                      {assetLabel}
                    </h3>
                    <p
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#dae2fd",
                      }}
                    >
                      {assetCount}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
