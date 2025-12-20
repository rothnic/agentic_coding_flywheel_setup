"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clock,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button, Card, CommandCard } from "@/components";
import { cn } from "@/lib/utils";
import { markStepComplete } from "@/lib/wizardSteps";

const ACFS_COMMAND = `curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/agentic_coding_flywheel_setup/main/install.sh?$(date +%s)" | bash -s -- --yes --mode vibe`;

const WHAT_IT_INSTALLS = [
  {
    category: "Shell & Terminal UX",
    items: ["zsh + oh-my-zsh + powerlevel10k", "atuin (shell history)", "fzf", "zoxide", "lsd"],
  },
  {
    category: "Languages & Package Managers",
    items: ["bun (JavaScript/TypeScript)", "uv (Python)", "rust/cargo", "go"],
  },
  {
    category: "Dev Tools",
    items: ["tmux", "ripgrep", "ast-grep", "lazygit", "bat"],
  },
  {
    category: "Coding Agents",
    items: ["Claude Code", "Codex CLI", "Gemini CLI"],
  },
  {
    category: "Cloud & Database",
    items: ["PostgreSQL 18", "Vault", "Wrangler", "Supabase CLI", "Vercel CLI"],
  },
  {
    category: "Dicklesworthstone Stack",
    items: ["ntm", "mcp_agent_mail", "beads_viewer", "and 5 more tools"],
  },
];

export default function RunInstallerPage() {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleContinue = useCallback(() => {
    markStepComplete(7);
    setIsNavigating(true);
    router.push("/wizard/reconnect-ubuntu");
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Header with sparkle */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Run the ACFS installer
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          This is the magic moment. One command sets everything up.
        </p>
      </div>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Don&apos;t close the terminal
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Stay connected during installation. If disconnected, SSH back in
              and check if it&apos;s still running.
            </p>
          </div>
        </div>
      </Card>

      {/* The command */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Paste this command in your SSH session
        </h2>
        <CommandCard
          command={ACFS_COMMAND}
          description="ACFS installer one-liner"
          showCheckbox
          persistKey="run-acfs-installer"
          className="border-2 border-primary/20"
        />
      </div>

      {/* Time estimate */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-5 w-5" />
        <span>Takes about 10-15 minutes depending on your VPS speed</span>
      </div>

      {/* What it installs - collapsible */}
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
        >
          <span className="font-semibold">What this command installs</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              showDetails && "rotate-180"
            )}
          />
        </button>
        {showDetails && (
          <div className="border-t px-4 pb-4">
            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              {WHAT_IT_INSTALLS.map((group) => (
                <div key={group.category}>
                  <h4 className="mb-2 font-medium">{group.category}</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View source */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          Want to see exactly what it does?
        </span>
        <a
          href="https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup/blob/main/install.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          View install.sh source
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Success signs */}
      <Card className="border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <div className="space-y-2">
          <h3 className="font-medium text-green-800 dark:text-green-200">
            You&apos;ll know it&apos;s done when you see:
          </h3>
          <div className="rounded bg-green-100 p-3 font-mono text-sm text-green-800 dark:bg-green-900/50 dark:text-green-200">
            <p>✔ ACFS installation complete!</p>
            <p className="text-green-600 dark:text-green-400">
              Please reconnect as: ssh ubuntu@YOUR_IP
            </p>
          </div>
        </div>
      </Card>

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} disabled={isNavigating} size="lg">
          {isNavigating ? "Loading..." : "Installation finished"}
        </Button>
      </div>
    </div>
  );
}
