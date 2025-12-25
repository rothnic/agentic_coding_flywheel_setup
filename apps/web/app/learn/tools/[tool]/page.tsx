"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, use } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  ChevronRight,
  GitBranch,
  GraduationCap,
  Home,
  KeyRound,
  LayoutGrid,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { motion } from "@/components/motion";

type ToolId =
  | "claude-code"
  | "codex-cli"
  | "gemini-cli"
  | "ntm"
  | "beads"
  | "agent-mail"
  | "ubs"
  | "cass"
  | "cm"
  | "caam"
  | "slb";

type ToolCard = {
  id: ToolId;
  title: string;
  tagline: string;
  icon: ReactNode;
  gradient: string;
  glowColor: string;
  /** Primary docs/repo link */
  docsUrl: string;
  docsLabel: string;
  /** Quick install or start command */
  quickCommand?: string;
  /** Related tools in ACFS */
  relatedTools: ToolId[];
};

const TOOLS: Record<ToolId, ToolCard> = {
  "claude-code": {
    id: "claude-code",
    title: "Claude Code",
    tagline: "Anthropic's AI coding agent - deep reasoning and architecture",
    icon: <Bot className="h-8 w-8" />,
    gradient: "from-orange-500/20 via-amber-500/20 to-orange-500/20",
    glowColor: "rgba(251,146,60,0.4)",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code",
    docsLabel: "Anthropic Docs",
    quickCommand: "cc",
    relatedTools: ["codex-cli", "gemini-cli", "ntm"],
  },
  "codex-cli": {
    id: "codex-cli",
    title: "Codex CLI",
    tagline: "OpenAI's coding agent - fast iteration and structured work",
    icon: <GraduationCap className="h-8 w-8" />,
    gradient: "from-emerald-500/20 via-teal-500/20 to-emerald-500/20",
    glowColor: "rgba(52,211,153,0.4)",
    docsUrl: "https://github.com/openai/codex",
    docsLabel: "GitHub",
    quickCommand: "cod",
    relatedTools: ["claude-code", "gemini-cli", "ntm"],
  },
  "gemini-cli": {
    id: "gemini-cli",
    title: "Gemini CLI",
    tagline: "Google's coding agent - large context exploration",
    icon: <Search className="h-8 w-8" />,
    gradient: "from-blue-500/20 via-indigo-500/20 to-blue-500/20",
    glowColor: "rgba(99,102,241,0.4)",
    docsUrl: "https://github.com/google-gemini/gemini-cli",
    docsLabel: "GitHub",
    quickCommand: "gmi",
    relatedTools: ["claude-code", "codex-cli", "ntm"],
  },
  ntm: {
    id: "ntm",
    title: "Named Tmux Manager",
    tagline: "The agent cockpit - spawn and orchestrate multiple agents",
    icon: <LayoutGrid className="h-8 w-8" />,
    gradient: "from-sky-500/20 via-blue-500/20 to-sky-500/20",
    glowColor: "rgba(56,189,248,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/named_tmux_manager",
    docsLabel: "GitHub",
    quickCommand: "ntm spawn myproject --cc=2",
    relatedTools: ["claude-code", "codex-cli", "agent-mail"],
  },
  beads: {
    id: "beads",
    title: "Beads",
    tagline: "Task graphs + robot triage for dependency-aware work tracking",
    icon: <GitBranch className="h-8 w-8" />,
    gradient: "from-emerald-500/20 via-teal-500/20 to-emerald-500/20",
    glowColor: "rgba(52,211,153,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/beads_viewer",
    docsLabel: "GitHub",
    quickCommand: "bd ready",
    relatedTools: ["agent-mail", "ubs"],
  },
  "agent-mail": {
    id: "agent-mail",
    title: "MCP Agent Mail",
    tagline: "Gmail for agents - messaging, threads, and file reservations",
    icon: <KeyRound className="h-8 w-8" />,
    gradient: "from-violet-500/20 via-purple-500/20 to-violet-500/20",
    glowColor: "rgba(139,92,246,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/mcp_agent_mail",
    docsLabel: "GitHub",
    relatedTools: ["ntm", "beads", "cass"],
  },
  ubs: {
    id: "ubs",
    title: "Ultimate Bug Scanner",
    tagline: "Fast polyglot static analysis - your pre-commit quality gate",
    icon: <ShieldCheck className="h-8 w-8" />,
    gradient: "from-rose-500/20 via-red-500/20 to-rose-500/20",
    glowColor: "rgba(244,63,94,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/ultimate_bug_scanner",
    docsLabel: "GitHub",
    quickCommand: "ubs .",
    relatedTools: ["beads", "slb"],
  },
  cass: {
    id: "cass",
    title: "CASS",
    tagline: "Search across all your agent sessions instantly",
    icon: <Search className="h-8 w-8" />,
    gradient: "from-cyan-500/20 via-sky-500/20 to-cyan-500/20",
    glowColor: "rgba(34,211,238,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/coding_agent_session_search",
    docsLabel: "GitHub",
    quickCommand: "cass search 'auth error' --robot",
    relatedTools: ["cm", "agent-mail"],
  },
  cm: {
    id: "cm",
    title: "CASS Memory",
    tagline: "Procedural memory - playbooks and lessons from past sessions",
    icon: <Wrench className="h-8 w-8" />,
    gradient: "from-fuchsia-500/20 via-pink-500/20 to-fuchsia-500/20",
    glowColor: "rgba(217,70,239,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/cass_memory_system",
    docsLabel: "GitHub",
    quickCommand: "cm context 'my task' --json",
    relatedTools: ["cass", "beads"],
  },
  caam: {
    id: "caam",
    title: "CAAM",
    tagline: "Switch agent credentials safely without account confusion",
    icon: <Wrench className="h-8 w-8" />,
    gradient: "from-amber-500/20 via-orange-500/20 to-amber-500/20",
    glowColor: "rgba(251,146,60,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/coding_agent_account_manager",
    docsLabel: "GitHub",
    relatedTools: ["claude-code", "codex-cli", "gemini-cli"],
  },
  slb: {
    id: "slb",
    title: "SLB",
    tagline: "Two-person rule for dangerous commands - safety first",
    icon: <ShieldCheck className="h-8 w-8" />,
    gradient: "from-yellow-500/20 via-orange-500/20 to-yellow-500/20",
    glowColor: "rgba(251,191,36,0.4)",
    docsUrl: "https://github.com/Dicklesworthstone/simultaneous_launch_button",
    docsLabel: "GitHub",
    relatedTools: ["ubs", "beads"],
  },
};

function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function RelatedToolCard({ toolId }: { toolId: ToolId }) {
  const tool = TOOLS[toolId];
  if (!tool) return null;

  return (
    <Link href={`/learn/tools/${toolId}`}>
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-md transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />

        <div
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} border border-white/10`}
        >
          <div className="text-white/90">{tool.icon}</div>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="truncate font-medium text-sm text-white/90 group-hover:text-white transition-colors">
            {tool.title}
          </div>
        </div>
        <ChevronRight className="relative h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors" />
      </motion.div>
    </Link>
  );
}

interface Props {
  params: Promise<{ tool: string }>;
}

export default function ToolCardPage({ params }: Props) {
  const { tool } = use(params);
  const doc = TOOLS[tool as ToolId];

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Dramatic ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingOrb
          className="w-[700px] h-[700px] bg-primary/10 blur-[180px] -top-48 left-1/4"
          delay={0}
        />
        <FloatingOrb
          className="w-[500px] h-[500px] bg-violet-500/10 blur-[150px] top-1/3 -right-24"
          delay={2}
        />
        <FloatingOrb
          className="w-[400px] h-[400px] bg-emerald-500/8 blur-[120px] bottom-0 left-0"
          delay={4}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_rgba(var(--primary-rgb),0.15),_transparent)]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-10 md:px-12 md:py-16">
        {/* Navigation */}
        <motion.div
          className="mb-10 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/learn"
            className="group flex items-center gap-2 text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Learning Hub</span>
          </Link>
          <Link
            href="/"
            className="group flex items-center gap-2 text-white/50 transition-colors hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Home</span>
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="group relative"
        >
          {/* Glow effect behind card */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: doc.glowColor }}
          />

          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            {/* Top gradient bar */}
            <div
              className={`h-1 w-full bg-gradient-to-r ${doc.gradient}`}
              style={{
                boxShadow: `0 0 30px ${doc.glowColor}`,
              }}
            />

            <div className="p-8 md:p-10">
              {/* Icon + Title */}
              <div className="relative mb-8 flex items-start gap-5">
                <motion.div
                  className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${doc.gradient} border border-white/10`}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                  style={{
                    boxShadow: `0 0 40px ${doc.glowColor}`,
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                  </div>
                  <div className="text-white relative z-10">{doc.icon}</div>
                </motion.div>

                <div className="min-w-0 flex-1 pt-1">
                  <motion.h1
                    className="mb-2 font-mono text-3xl font-bold tracking-tight text-white md:text-4xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {doc.title}
                  </motion.h1>
                  <motion.p
                    className="text-lg text-white/60"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {doc.tagline}
                  </motion.p>
                </div>
              </div>

              {/* Primary CTA - Documentation Link */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <a
                  href={doc.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative flex w-full items-center justify-center gap-3 rounded-xl bg-white/10 border border-white/10 py-4 px-6 font-semibold text-white transition-all duration-300 hover:bg-white/15 hover:border-white/20 hover:shadow-lg"
                  style={{
                    boxShadow: `0 4px 30px rgba(0,0,0,0.3)`,
                  }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>View Full Documentation on {doc.docsLabel}</span>
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                </a>
              </motion.div>

              {/* Quick Command */}
              {doc.quickCommand && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                      Quick Start
                    </span>
                  </div>
                  <div className="relative group/cmd rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05]">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      <span className="ml-2 text-xs text-white/30">
                        terminal
                      </span>
                    </div>
                    <div className="p-4 font-mono text-sm">
                      <span className="text-emerald-400">$</span>
                      <span className="text-white/90 ml-2">
                        {doc.quickCommand}
                      </span>
                    </div>
                    {/* Copy hint */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/cmd:opacity-100 transition-opacity">
                      <span className="text-xs text-white/40">
                        Click to copy
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Related Tools */}
              {doc.relatedTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                      Related Tools
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {doc.relatedTools.slice(0, 4).map((relatedId, index) => (
                      <motion.div
                        key={relatedId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                      >
                        <RelatedToolCard toolId={relatedId} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Link
            href="/learn/commands"
            className="group flex items-center gap-2 text-white/50 transition-colors hover:text-primary"
          >
            <span className="text-sm">See all commands in the Command Reference</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* Custom shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
