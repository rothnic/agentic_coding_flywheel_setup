"use client";

import { motion } from "@/components/motion";
import {
  Bug,
  Shield,
  Terminal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Search,
  FileCode,
  GitCommit,
  Lightbulb,
} from "lucide-react";
import {
  Section,
  Paragraph,
  CodeBlock,
  TipBox,
  Highlight,
  Divider,
  GoalBanner,
  CommandList,
  FeatureCard,
  FeatureGrid,
} from "./lesson-components";

export function UbsLesson() {
  return (
    <div className="space-y-8">
      <GoalBanner>
        Learn to catch bugs before they reach production with UBS.
      </GoalBanner>

      {/* What Is UBS */}
      <Section
        title="What Is UBS?"
        icon={<Bug className="h-5 w-5" />}
        delay={0.1}
      >
        <Paragraph>
          <Highlight>UBS (Ultimate Bug Scanner)</Highlight> is your safety net
          before every commit. It scans your code for common bugs, security
          issues, and anti-patterns that might slip through during development.
        </Paragraph>
        <Paragraph>
          Think of it as a code review bot that catches issues in seconds, not
          hours.
        </Paragraph>

        <div className="mt-8">
          <FeatureGrid>
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Security Scanning"
              description="XSS, injection, and OWASP vulnerabilities"
              gradient="from-red-500/20 to-rose-500/20"
            />
            <FeatureCard
              icon={<Bug className="h-5 w-5" />}
              title="Bug Detection"
              description="Null safety, async/await, type issues"
              gradient="from-amber-500/20 to-orange-500/20"
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Fast Feedback"
              description="Scan a file in under 1 second"
              gradient="from-primary/20 to-violet-500/20"
            />
            <FeatureCard
              icon={<FileCode className="h-5 w-5" />}
              title="Multi-Language"
              description="TypeScript, Python, Rust, Go, and more"
              gradient="from-emerald-500/20 to-teal-500/20"
            />
          </FeatureGrid>
        </div>
      </Section>

      <Divider />

      {/* The Golden Rule */}
      <Section
        title="The Golden Rule"
        icon={<GitCommit className="h-5 w-5" />}
        delay={0.15}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                Run <code className="text-amber-400">ubs</code> before every
                commit.
              </p>
              <p className="text-white/60 mt-1">
                Exit 0 = safe to commit. Exit &gt;0 = fix issues first.
              </p>
            </div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* Essential Commands */}
      <Section
        title="Essential Commands"
        icon={<Terminal className="h-5 w-5" />}
        delay={0.2}
      >
        <CommandList
          commands={[
            {
              command: "ubs file.ts",
              description: "Scan a specific file (fastest)",
            },
            {
              command: "ubs src/",
              description: "Scan a directory",
            },
            {
              command: "ubs $(git diff --name-only --cached)",
              description: "Scan staged files before commit",
            },
            {
              command: "ubs --only=js,python src/",
              description: "Filter by language (3-5x faster)",
            },
            {
              command: "ubs .",
              description: "Scan whole project (ignores node_modules)",
            },
          ]}
        />

        <div className="mt-6">
          <TipBox variant="tip">
            Always scope to changed files when possible.{" "}
            <code>ubs file.ts</code> runs in under 1 second, while{" "}
            <code>ubs .</code> may take 30+ seconds.
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* Understanding Output */}
      <Section
        title="Understanding Output"
        icon={<Search className="h-5 w-5" />}
        delay={0.25}
      >
        <Paragraph>UBS output follows a consistent format:</Paragraph>

        <div className="mt-6">
          <CodeBlock
            code={`⚠️  Null Safety (3 errors)
    src/api/users.ts:42:5 – Possible null dereference
    💡 Use optional chaining: user?.profile

    src/api/users.ts:87:12 – Unchecked array access
    💡 Add bounds check before accessing array[i]

⚠️  Security (1 error)
    src/api/auth.ts:23:8 – SQL injection risk
    💡 Use parameterized queries instead of string concat

Exit code: 1`}
            language="text"
            filename="ubs output"
          />
        </div>

        <div className="mt-6 space-y-4">
          <OutputExplainer
            pattern="file:line:col"
            meaning="Exact location of the issue"
            color="text-emerald-400"
          />
          <OutputExplainer
            pattern="💡"
            meaning="Suggested fix"
            color="text-amber-400"
          />
          <OutputExplainer
            pattern="Exit code 0/1"
            meaning="Pass (safe) / Fail (needs fixes)"
            color="text-primary"
          />
        </div>
      </Section>

      <Divider />

      {/* Bug Severity */}
      <Section
        title="Bug Severity Guide"
        icon={<AlertTriangle className="h-5 w-5" />}
        delay={0.3}
      >
        <div className="space-y-4">
          <SeverityCard
            level="Critical"
            icon={<XCircle className="h-5 w-5" />}
            color="from-red-500/20 to-rose-500/20"
            border="border-red-500/30"
            examples={[
              "Null safety violations",
              "XSS/Injection vulnerabilities",
              "Async/await issues",
              "Memory leaks",
            ]}
            action="Always fix immediately"
          />
          <SeverityCard
            level="Important"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="from-amber-500/20 to-orange-500/20"
            border="border-amber-500/30"
            examples={[
              "Type narrowing issues",
              "Division by zero risks",
              "Resource leaks",
              "Missing error handling",
            ]}
            action="Fix before production"
          />
          <SeverityCard
            level="Contextual"
            icon={<CheckCircle className="h-5 w-5" />}
            color="from-primary/20 to-violet-500/20"
            border="border-primary/30"
            examples={[
              "TODO/FIXME comments",
              "Console.log statements",
              "Unused variables",
              "Magic numbers",
            ]}
            action="Use judgment"
          />
        </div>
      </Section>

      <Divider />

      {/* The Fix Workflow */}
      <Section
        title="The Fix Workflow"
        icon={<Zap className="h-5 w-5" />}
        delay={0.35}
      >
        <FixWorkflow />
      </Section>

      <Divider />

      {/* Pre-Commit Hook */}
      <Section
        title="Pre-Commit Integration"
        icon={<GitCommit className="h-5 w-5" />}
        delay={0.4}
      >
        <Paragraph>
          For maximum safety, add UBS to your pre-commit workflow:
        </Paragraph>

        <div className="mt-6">
          <CodeBlock
            code={`# In your workflow:
$ git add .
$ ubs $(git diff --name-only --cached)
# If exit 0: proceed with commit
# If exit 1: fix issues first

$ git commit -m "feat: add user auth"`}
            showLineNumbers
          />
        </div>

        <div className="mt-6">
          <TipBox variant="info">
            ACFS agents are trained to run <code>ubs</code> automatically
            before committing. You get this protection by default!
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* Try It Now */}
      <Section
        title="Try It Now"
        icon={<Terminal className="h-5 w-5" />}
        delay={0.45}
      >
        <CodeBlock
          code={`# View session logs
$ ubs sessions --entries 1

# Scan your project
$ ubs .

# Get help
$ ubs --help`}
          showLineNumbers
        />
      </Section>
    </div>
  );
}

// =============================================================================
// OUTPUT EXPLAINER
// =============================================================================
function OutputExplainer({
  pattern,
  meaning,
  color,
}: {
  pattern: string;
  meaning: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <code className={`font-mono text-sm font-medium ${color}`}>{pattern}</code>
      <span className="text-white/40 group-hover:text-white/60 transition-colors">→</span>
      <span className="text-white/60 group-hover:text-white/80 transition-colors">{meaning}</span>
    </motion.div>
  );
}

// =============================================================================
// SEVERITY CARD
// =============================================================================
function SeverityCard({
  level,
  icon,
  color,
  border,
  examples,
  action,
}: {
  level: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  examples: string[];
  action: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative rounded-2xl border ${border} bg-gradient-to-br ${color} p-6 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/[0.2]`}
    >
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-lg mb-3">{level}</h4>
          <ul className="space-y-2 mb-4">
            {examples.map((ex, i) => (
              <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                {ex}
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {action}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// FIX WORKFLOW
// =============================================================================
function FixWorkflow() {
  const steps = [
    { title: "Read finding", desc: "Understand the category and fix suggestion" },
    { title: "Navigate to location", desc: "Go to file:line:col" },
    { title: "Verify it's real", desc: "Not all findings are bugs—some are false positives" },
    { title: "Fix root cause", desc: "Don't just mask the symptom" },
    { title: "Re-run UBS", desc: "Confirm the fix worked (exit 0)" },
    { title: "Commit", desc: "Now you're safe to commit!" },
  ];

  return (
    <div className="relative p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative space-y-5">
        <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-red-500/50 via-amber-500/50 to-emerald-500/50" />

        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ x: 4 }}
            className="relative flex items-start gap-4 pl-2 group"
          >
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-white text-sm font-bold shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-shadow duration-300">
              {i + 1}
            </div>
            <div className="pt-1">
              <h4 className="font-semibold text-white group-hover:text-primary transition-colors duration-300">{step.title}</h4>
              <p className="text-sm text-white/50">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
