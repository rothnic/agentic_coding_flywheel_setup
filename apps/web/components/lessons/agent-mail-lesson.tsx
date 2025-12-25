"use client";

import { motion } from "@/components/motion";
import {
  Mail,
  Users,
  FileText,
  Lock,
  MessageSquare,
  Send,
  Inbox,
  Search,
  Bot,
  Workflow,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Section,
  Paragraph,
  CodeBlock,
  TipBox,
  Highlight,
  Divider,
  GoalBanner,
  FeatureCard,
  FeatureGrid,
} from "./lesson-components";

export function AgentMailLesson() {
  return (
    <div className="space-y-8">
      <GoalBanner>
        Coordinate multiple agents without conflicts using Agent Mail.
      </GoalBanner>

      {/* What Is Agent Mail */}
      <Section
        title="What Is Agent Mail?"
        icon={<Mail className="h-5 w-5" />}
        delay={0.1}
      >
        <Paragraph>
          <Highlight>MCP Agent Mail</Highlight> is a coordination system that
          lets multiple AI agents work on the same project without stepping on
          each other&apos;s toes.
        </Paragraph>
        <Paragraph>
          Think of it as email + file locking for agents. Agents can send
          messages, claim files they&apos;re working on, and stay in sync—all
          persisted in git.
        </Paragraph>

        <div className="mt-8">
          <FeatureGrid>
            <FeatureCard
              icon={<MessageSquare className="h-5 w-5" />}
              title="Messaging"
              description="Agents send and receive messages with context"
              gradient="from-primary/20 to-violet-500/20"
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5" />}
              title="File Reservations"
              description="Advisory locks prevent edit conflicts"
              gradient="from-amber-500/20 to-orange-500/20"
            />
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Searchable Threads"
              description="Find past decisions and discussions"
              gradient="from-emerald-500/20 to-teal-500/20"
            />
            <FeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="Git Persistence"
              description="All artifacts are human-auditable in git"
              gradient="from-blue-500/20 to-indigo-500/20"
            />
          </FeatureGrid>
        </div>
      </Section>

      <Divider />

      {/* Why Coordination Matters */}
      <Section
        title="Why Coordination Matters"
        icon={<Users className="h-5 w-5" />}
        delay={0.15}
      >
        <Paragraph>
          Without coordination, multiple agents working on the same codebase
          can:
        </Paragraph>

        <div className="mt-6 space-y-4">
          <ProblemCard
            problem="Overwrite each other's changes"
            solution="File reservations prevent conflicts"
          />
          <ProblemCard
            problem="Duplicate work on the same task"
            solution="Message threads track who's doing what"
          />
          <ProblemCard
            problem="Make conflicting architectural decisions"
            solution="Shared context via searchable threads"
          />
        </div>

        <div className="mt-6">
          <TipBox variant="info">
            Agent Mail is available as an MCP server. Your agents can use it
            automatically when configured!
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* Core Concepts */}
      <Section
        title="Core Concepts"
        icon={<Workflow className="h-5 w-5" />}
        delay={0.2}
      >
        <div className="space-y-8">
          {/* Project & Agents */}
          <ConceptCard
            icon={<Bot className="h-5 w-5" />}
            title="Projects & Agents"
            description="Each project has registered agents with unique names"
          >
            <CodeBlock
              code={`# Agent names are adjective+noun combinations
# Examples: "BlueLake", "GreenCastle", "RedStone"

# Register an agent
ensure_project(human_key="/data/projects/my-app")
register_agent(
  project_key="/data/projects/my-app",
  program="claude-code",
  model="opus-4.5"
)`}
              language="python"
            />
          </ConceptCard>

          {/* Messages */}
          <ConceptCard
            icon={<Send className="h-5 w-5" />}
            title="Sending Messages"
            description="Agents communicate via structured messages"
          >
            <CodeBlock
              code={`send_message(
  project_key="/data/projects/my-app",
  sender_name="BlueLake",
  to=["GreenCastle"],
  subject="API design question",
  body_md="Should we use REST or GraphQL for the new endpoint?"
)`}
              language="python"
            />
          </ConceptCard>

          {/* File Reservations */}
          <ConceptCard
            icon={<Lock className="h-5 w-5" />}
            title="File Reservations"
            description="Claim files before editing to prevent conflicts"
          >
            <CodeBlock
              code={`# Reserve files before editing
file_reservation_paths(
  project_key="/data/projects/my-app",
  agent_name="BlueLake",
  paths=["src/api/*.py", "src/routes/*.py"],
  ttl_seconds=3600,  # 1 hour lease
  exclusive=true     # No one else can edit
)

# Release when done
release_file_reservations(
  project_key="/data/projects/my-app",
  agent_name="BlueLake"
)`}
              language="python"
            />
          </ConceptCard>

          {/* Inbox */}
          <ConceptCard
            icon={<Inbox className="h-5 w-5" />}
            title="Checking Your Inbox"
            description="Fetch messages addressed to you"
          >
            <CodeBlock
              code={`# Check for new messages
fetch_inbox(
  project_key="/data/projects/my-app",
  agent_name="BlueLake",
  since_ts="2025-01-15T10:00:00Z",
  include_bodies=true
)

# Acknowledge important messages
acknowledge_message(
  project_key="/data/projects/my-app",
  agent_name="BlueLake",
  message_id=1234
)`}
              language="python"
            />
          </ConceptCard>
        </div>
      </Section>

      <Divider />

      {/* Common Patterns */}
      <Section
        title="Common Patterns"
        icon={<Workflow className="h-5 w-5" />}
        delay={0.25}
      >
        <div className="space-y-6">
          <PatternCard
            title="Starting a Session"
            description="Use the macro for quick setup"
            code={`macro_start_session(
  human_key="/data/projects/my-app",
  program="claude-code",
  model="opus-4.5",
  task_description="Implementing auth"
)`}
          />

          <PatternCard
            title="Replying to a Thread"
            description="Keep discussions organized"
            code={`reply_message(
  project_key="/data/projects/my-app",
  message_id=1234,
  sender_name="GreenCastle",
  body_md="I agree, let's use GraphQL. Starting work now."
)`}
          />

          <PatternCard
            title="Searching Past Discussions"
            description="Find relevant context"
            code={`search_messages(
  project_key="/data/projects/my-app",
  query="authentication AND JWT",
  limit=10
)`}
          />
        </div>
      </Section>

      <Divider />

      {/* The Coordination Flow */}
      <Section
        title="The Coordination Flow"
        icon={<Workflow className="h-5 w-5" />}
        delay={0.3}
      >
        <CoordinationFlow />
      </Section>

      <Divider />

      {/* Best Practices */}
      <Section
        title="Best Practices"
        icon={<CheckCircle className="h-5 w-5" />}
        delay={0.35}
      >
        <div className="space-y-4">
          <BestPractice
            title="Reserve before editing"
            description="Always claim files before making changes to prevent conflicts"
          />
          <BestPractice
            title="Keep subjects specific"
            description="Use descriptive subjects (≤80 chars) for easy searching"
          />
          <BestPractice
            title="Use thread_id consistently"
            description="Keep related discussions in the same thread"
          />
          <BestPractice
            title="Set realistic TTLs"
            description="Don't hold file reservations longer than needed"
          />
          <BestPractice
            title="Acknowledge when required"
            description="Use acknowledge_message for ack_required messages"
          />
        </div>

        <div className="mt-6">
          <TipBox variant="warning">
            If you see <code>FILE_RESERVATION_CONFLICT</code>, another agent
            has the file. Wait for expiry, adjust your patterns, or use
            non-exclusive reservations.
          </TipBox>
        </div>
      </Section>

      <Divider />

      {/* Quick Reference */}
      <Section
        title="Quick Reference"
        icon={<FileText className="h-5 w-5" />}
        delay={0.4}
      >
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] bg-gradient-to-r from-primary/10 to-violet-500/10">
            <span className="font-bold text-white text-lg">Key Functions</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <FunctionRow name="ensure_project" purpose="Initialize a project" />
            <FunctionRow name="register_agent" purpose="Register your identity" />
            <FunctionRow name="send_message" purpose="Send a message" />
            <FunctionRow name="reply_message" purpose="Reply to a thread" />
            <FunctionRow name="fetch_inbox" purpose="Get your messages" />
            <FunctionRow name="acknowledge_message" purpose="Confirm receipt" />
            <FunctionRow name="file_reservation_paths" purpose="Claim files" />
            <FunctionRow name="release_file_reservations" purpose="Release files" />
            <FunctionRow name="search_messages" purpose="Search threads" />
            <FunctionRow name="macro_start_session" purpose="Quick session setup" />
          </div>
        </div>
      </Section>
    </div>
  );
}

// =============================================================================
// PROBLEM CARD
// =============================================================================
function ProblemCard({
  problem,
  solution,
}: {
  problem: string;
  solution: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="group flex items-center gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 group-hover:bg-red-500/30 transition-colors">
        ✗
      </div>
      <div className="flex-1">
        <span className="text-white/50 line-through">{problem}</span>
      </div>
      <div className="text-white/30 group-hover:text-white/50 transition-colors">→</div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
        ✓
      </div>
      <div className="flex-1">
        <span className="text-white/80 font-medium">{solution}</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CONCEPT CARD
// =============================================================================
function ConceptCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative space-y-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/[0.12]"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 text-primary shadow-lg shadow-primary/10">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-white text-lg">{title}</h4>
          <p className="text-sm text-white/50">{description}</p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// =============================================================================
// PATTERN CARD
// =============================================================================
function PatternCard({
  title,
  description,
  code,
}: {
  title: string;
  description: string;
  code: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/[0.15]"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-5 border-b border-white/[0.06] bg-white/[0.02]">
        <h4 className="font-bold text-white text-lg">{title}</h4>
        <p className="text-sm text-white/50 mt-1">{description}</p>
      </div>
      <div className="relative p-4">
        <CodeBlock code={code} language="python" />
      </div>
    </motion.div>
  );
}

// =============================================================================
// COORDINATION FLOW
// =============================================================================
function CoordinationFlow() {
  const steps = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: "Register",
      desc: "Agent joins the project with a unique name",
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Reserve",
      desc: "Claim files before editing",
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      icon: <Send className="h-5 w-5" />,
      title: "Communicate",
      desc: "Send messages to coordinate",
      color: "from-primary/20 to-violet-500/20",
      borderColor: "border-primary/30",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Work",
      desc: "Make changes within your reservation",
      color: "from-sky-500/20 to-cyan-500/20",
      borderColor: "border-sky-500/30",
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Release",
      desc: "Free files for other agents",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
    },
  ];

  return (
    <div className="relative p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-wrap justify-center items-start gap-3 sm:gap-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.05 }}
              className="group flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} border ${step.borderColor} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                {step.icon}
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-sm group-hover:text-primary transition-colors duration-300">{step.title}</p>
                <p className="text-xs text-white/50 max-w-[100px]">{step.desc}</p>
              </div>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="hidden sm:block text-white/30 text-xl font-light"
              >
                →
              </motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
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
        <CheckCircle className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{title}</p>
        <p className="text-sm text-white/50 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// FUNCTION ROW
// =============================================================================
function FunctionRow({ name, purpose }: { name: string; purpose: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="group flex items-center gap-4 p-4 transition-all duration-200 hover:bg-white/[0.02]"
    >
      <code className="text-sm text-primary font-mono font-medium px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
        {name}
      </code>
      <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">{purpose}</span>
    </motion.div>
  );
}
