"use client";

import { motion } from "@/components/motion";
import {
  Brain,
  Lightbulb,
  BookOpen,
  Database,
  Terminal,
  Sparkles,
  Target,
  AlertCircle,
  CheckCircle,
  FileText,
  Zap,
  RefreshCw,
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

export function CmLesson() {
  return (
    <div className="space-y-8">
      <GoalBanner>
        Build procedural memory for agents that improves over time.
      </GoalBanner>

      {/* What Is CM */}
      <Section
        title="What Is CM?"
        icon={<Brain className="h-5 w-5" />}
        delay={0.1}
      >
        <Paragraph>
          <Highlight>CM (CASS Memory System)</Highlight> gives AI agents
          effective memory by extracting lessons from past sessions and making
          them retrievable for future work.
        </Paragraph>
        <Paragraph>
          Think of it like how humans learn: you encounter a problem, solve it,
          and remember the solution. CM does this for your agents automatically.
        </Paragraph>

        <div className="mt-8">
          <FeatureGrid>
            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Lesson Extraction"
              description="Automatically extract rules from past sessions"
              gradient="from-primary/20 to-violet-500/20"
            />
            <FeatureCard
              icon={<Target className="h-5 w-5" />}
              title="Context Retrieval"
              description="Get relevant rules before starting tasks"
              gradient="from-emerald-500/20 to-teal-500/20"
            />
            <FeatureCard
              icon={<AlertCircle className="h-5 w-5" />}
              title="Anti-Patterns"
              description="Learn what NOT to do from past mistakes"
              gradient="from-red-500/20 to-rose-500/20"
            />
            <FeatureCard
              icon={<RefreshCw className="h-5 w-5" />}
              title="Continuous Learning"
              description="Memory improves with every session"
              gradient="from-amber-500/20 to-orange-500/20"
            />
          </FeatureGrid>
        </div>
      </Section>

      <Divider />

      {/* How It Works */}
      <Section
        title="How It Works"
        icon={<Sparkles className="h-5 w-5" />}
        delay={0.15}
      >
        <MemoryDiagram />

        <div className="mt-8">
          <TipBox variant="info">
            CM builds a &quot;playbook&quot; of rules over time. The more
            sessions you analyze, the smarter your agents become!
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* The Onboarding Flow */}
      <Section
        title="Onboarding: Building Your Playbook"
        icon={<BookOpen className="h-5 w-5" />}
        delay={0.2}
      >
        <Paragraph>
          The <code>cm onboard</code> command guides you through analyzing past
          sessions and extracting valuable rules:
        </Paragraph>

        <div className="mt-6">
          <OnboardingSteps />
        </div>
      </Section>

      <Divider />

      {/* Essential Commands */}
      <Section
        title="Essential Commands"
        icon={<Terminal className="h-5 w-5" />}
        delay={0.25}
      >
        <CommandList
          commands={[
            {
              command: "cm onboard status",
              description: "Check playbook status and recommendations",
            },
            {
              command: "cm onboard sample --fill-gaps",
              description: "Get sessions to analyze (filtered by gaps)",
            },
            {
              command: "cm onboard read /path/session.jsonl --template",
              description: "Read a session with rich context",
            },
            {
              command: 'cm playbook add "rule" --category "debugging"',
              description: "Add an extracted rule",
            },
            {
              command: "cm onboard mark-done /path/session.jsonl",
              description: "Mark session as processed",
            },
            {
              command: 'cm context "task description" --json',
              description: "Get relevant context for a task",
            },
          ]}
        />
      </Section>

      <Divider />

      {/* Using Context */}
      <Section
        title="Using Context Before Tasks"
        icon={<Target className="h-5 w-5" />}
        delay={0.3}
      >
        <Paragraph>
          Before starting complex tasks, retrieve relevant context from your
          playbook:
        </Paragraph>

        <div className="mt-6">
          <CodeBlock
            code={`$ cm context "implement user authentication" --json

{
  "relevantBullets": [
    {
      "id": "b-8f3a2c",
      "rule": "Always use bcrypt with cost factor ≥12 for password hashing",
      "category": "security"
    },
    {
      "id": "b-2d4e1f",
      "rule": "Store JWT secrets in environment variables, never in code",
      "category": "security"
    }
  ],
  "antiPatterns": [
    {
      "id": "ap-9c7b3d",
      "pattern": "Using MD5 for password storage",
      "consequence": "Trivially reversible, security vulnerability"
    }
  ],
  "historySnippets": [
    {
      "session": "2025-01-10.jsonl",
      "summary": "Implemented OAuth2 flow with refresh tokens"
    }
  ],
  "suggestedCassQueries": [
    "authentication error handling",
    "JWT refresh token"
  ]
}`}
            language="json"
          />
        </div>

        <div className="mt-6">
          <TipBox variant="tip">
            Reference rule IDs in your work. For example: &quot;Following
            b-8f3a2c, using bcrypt with cost 12...&quot;
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* The Protocol */}
      <Section
        title="The Memory Protocol"
        icon={<Zap className="h-5 w-5" />}
        delay={0.35}
      >
        <div className="space-y-6">
          <ProtocolStep
            number={1}
            title="START"
            description='Run cm context "<task>" --json before non-trivial work'
          />
          <ProtocolStep
            number={2}
            title="WORK"
            description='Reference rule IDs when following them (e.g., "Following b-8f3a2c...")'
          />
          <ProtocolStep
            number={3}
            title="FEEDBACK"
            description="Leave inline comments when rules help or hurt"
          />
          <ProtocolStep
            number={4}
            title="END"
            description="Just finish your work. Learning happens automatically."
          />
        </div>

        <div className="mt-6">
          <CodeBlock
            code={`// Feedback format in code:
// [cass: helpful b-8f3a2c] - bcrypt recommendation prevented weak hashing
// [cass: harmful b-xyz123] - this rule didn't apply to async context`}
            language="typescript"
          />
        </div>
      </Section>

      <Divider />

      {/* Rule Categories */}
      <Section
        title="Rule Categories"
        icon={<FileText className="h-5 w-5" />}
        delay={0.4}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryCard
            name="debugging"
            description="Problem-solving techniques"
            color="from-red-500/20 to-rose-500/20"
          />
          <CategoryCard
            name="security"
            description="Security best practices"
            color="from-amber-500/20 to-orange-500/20"
          />
          <CategoryCard
            name="performance"
            description="Optimization patterns"
            color="from-emerald-500/20 to-teal-500/20"
          />
          <CategoryCard
            name="architecture"
            description="Design decisions"
            color="from-primary/20 to-violet-500/20"
          />
          <CategoryCard
            name="testing"
            description="Test strategies"
            color="from-blue-500/20 to-indigo-500/20"
          />
          <CategoryCard
            name="tooling"
            description="Tool-specific knowledge"
            color="from-pink-500/20 to-rose-500/20"
          />
        </div>
      </Section>

      <Divider />

      {/* Best Practices */}
      <Section
        title="Best Practices"
        icon={<CheckCircle className="h-5 w-5" />}
        delay={0.45}
      >
        <div className="space-y-4">
          <BestPractice
            title="Run cm context before complex tasks"
            description="Don't reinvent the wheel—check what you've learned"
          />
          <BestPractice
            title="Extract specific, actionable rules"
            description="'Use bcrypt cost ≥12' is better than 'be secure'"
          />
          <BestPractice
            title="Include anti-patterns"
            description="What NOT to do is as valuable as what to do"
          />
          <BestPractice
            title="Categorize rules properly"
            description="Makes retrieval more accurate"
          />
          <BestPractice
            title="Provide feedback on rules"
            description="Helps the system learn which rules are actually useful"
          />
        </div>
      </Section>

      <Divider />

      {/* Try It Now */}
      <Section
        title="Try It Now"
        icon={<Terminal className="h-5 w-5" />}
        delay={0.5}
      >
        <CodeBlock
          code={`# Check your playbook status
$ cm onboard status

# Get context for your current task
$ cm context "refactor database queries" --json

# See what sessions need analysis
$ cm onboard sample --fill-gaps`}
          showLineNumbers
        />
      </Section>
    </div>
  );
}

// =============================================================================
// MEMORY DIAGRAM
// =============================================================================
function MemoryDiagram() {
  return (
    <div className="relative p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Past Sessions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ y: -4, scale: 1.05 }}
          className="group flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10 group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300">
            <Database className="h-10 w-10 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Past Sessions</span>
          <span className="text-xs text-white/40">Raw conversations</span>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/30 text-2xl hidden md:block"
        >
          →
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/30 text-2xl md:hidden rotate-90"
        >
          →
        </motion.div>

        {/* CM Processing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.05 }}
          className="group flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 shadow-lg shadow-primary/10 group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">CM Analysis</span>
          <span className="text-xs text-white/40">Extract lessons</span>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/30 text-2xl hidden md:block"
        >
          →
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/30 text-2xl md:hidden rotate-90"
        >
          →
        </motion.div>

        {/* Playbook */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.05 }}
          className="group flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:shadow-xl group-hover:shadow-emerald-500/20 transition-all duration-300">
            <BookOpen className="h-10 w-10 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">Playbook</span>
          <span className="text-xs text-white/40">Actionable rules</span>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// ONBOARDING STEPS
// =============================================================================
function OnboardingSteps() {
  const steps = [
    {
      cmd: "cm onboard status",
      desc: "Check status and see recommendations",
    },
    {
      cmd: "cm onboard sample --fill-gaps",
      desc: "Get sessions filtered by playbook gaps",
    },
    {
      cmd: "cm onboard read /path/session.jsonl --template",
      desc: "Read session with rich context",
    },
    {
      cmd: 'cm playbook add "rule" --category "category"',
      desc: "Add extracted rules",
    },
    {
      cmd: "cm onboard mark-done /path/session.jsonl",
      desc: "Mark session as processed",
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ x: 4, scale: 1.01 }}
          className="group flex items-start gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white text-sm font-bold shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-shadow">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <code className="text-sm text-primary break-all font-medium">{step.cmd}</code>
            <p className="text-sm text-white/50 mt-1">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// =============================================================================
// PROTOCOL STEP
// =============================================================================
function ProtocolStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="group flex items-start gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white font-bold text-lg shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-shadow">
        {number}
      </div>
      <div className="pt-1">
        <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-white/60 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CATEGORY CARD
// =============================================================================
function CategoryCard({
  name,
  description,
  color,
}: {
  name: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.03 }}
      className={`group relative rounded-2xl border border-white/[0.08] bg-gradient-to-br ${color} p-5 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/[0.2]`}
    >
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <code className="relative text-sm text-white font-mono font-medium">{name}</code>
      <p className="relative text-xs text-white/60 mt-2">{description}</p>
    </motion.div>
  );
}

// =============================================================================
// BEST PRACTICE
// =============================================================================
function BestPractice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="group flex items-start gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:shadow-emerald-500/20 transition-shadow">
        <Lightbulb className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{title}</p>
        <p className="text-sm text-white/50 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}
