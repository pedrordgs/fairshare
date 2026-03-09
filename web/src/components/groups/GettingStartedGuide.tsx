import React from "react";
import { ButtonPrimary, ButtonSecondary } from "@components/ui/Button";

interface GettingStartedGuideProps {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

const steps = [
  {
    number: "01",
    stagger: "stagger-1",
    title: "Create a Group",
    description:
      "Set up a shared space for a trip, household, or any ongoing costs.",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 11a4 4 0 100-8 4 4 0 000 8zm10 0a2 2 0 100-4 2 2 0 000 4zm4 4a3 3 0 00-5.356-1.857"
        />
      </svg>
    ),
  },
  {
    number: "02",
    stagger: "stagger-2",
    title: "Invite Members",
    description:
      "Share an invite code—anyone can join without needing to sign up first.",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    stagger: "stagger-3",
    title: "Track & Settle",
    description:
      "Log expenses as you go, see live balances, and settle up with ease.",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
        />
      </svg>
    ),
  },
];

export const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  onCreateGroup,
  onJoinGroup,
}) => {
  return (
    <div className="py-12 md:py-16">
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="text-center mb-12 fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-accent-700 text-xs font-medium tracking-widest uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
          Getting Started
        </div>

        <h2 className="text-3xl md:text-4xl text-slate-900 mb-4">
          Track shared expenses,{" "}
          <span className="text-gradient">settle fairly.</span>
        </h2>

        <p className="text-slate-500 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
          Create a group, add shared costs as you go, and let FairShare
          calculate who owes what—no awkward conversations needed.
        </p>
      </div>

      {/* ── Steps ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {steps.map(({ number, stagger, title, description, icon }) => (
          <div
            key={number}
            className={`slide-up ${stagger} group relative p-6 rounded-xl bg-primary-50 border border-primary-100 hover:bg-white hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200`}
          >
            {/* Accent line that appears on hover */}
            <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r from-accent-400 to-accent-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                {icon}
              </div>
              <span className="text-[11px] font-bold text-primary-400 tracking-[0.15em] uppercase">
                Step {number}
              </span>
            </div>

            <h3
              className="text-base font-semibold text-slate-800 mb-1.5"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>

      {/* ── CTAs ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 slide-up stagger-4">
        <ButtonPrimary
          size="lg"
          onClick={onCreateGroup}
          className="w-full sm:w-auto"
        >
          Create Your First Group
        </ButtonPrimary>
        <ButtonSecondary
          size="lg"
          onClick={onJoinGroup}
          className="w-full sm:w-auto"
        >
          Join an Existing Group
        </ButtonSecondary>
      </div>
    </div>
  );
};
