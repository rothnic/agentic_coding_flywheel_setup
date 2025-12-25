"use client";

import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Book,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  Home,
  List,
  Lock,
  Play,
  Terminal,
  Sparkles,
} from "lucide-react";
import { motion } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LESSONS,
  TOTAL_LESSONS,
  useCompletedLessons,
  getCompletionPercentage,
  getNextUncompletedLesson,
} from "@/lib/lessonProgress";
import { backgrounds, springs } from "@/lib/design-tokens";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type LessonStatus = "completed" | "current" | "locked";

function getLessonStatus(
  lessonId: number,
  completedLessons: number[]
): LessonStatus {
  if (completedLessons.includes(lessonId)) {
    return "completed";
  }
  // First uncompleted lesson is "current"
  const firstUncompleted = LESSONS.find(
    (l) => !completedLessons.includes(l.id)
  );
  if (firstUncompleted?.id === lessonId) {
    return "current";
  }
  return "locked";
}

function LessonCard({
  lesson,
  status,
  index,
  isSelected,
  prefersReducedMotion,
}: {
  lesson: (typeof LESSONS)[0];
  status: LessonStatus;
  index: number;
  isSelected?: boolean;
  prefersReducedMotion?: boolean;
}) {
  const isAccessible = status !== "locked";

  const cardContent = (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { ...springs.smooth, delay: index * 0.05 }}
      whileHover={isAccessible && !prefersReducedMotion ? { y: -4, scale: 1.02 } : undefined}
      whileTap={isAccessible && !prefersReducedMotion ? { scale: 0.98 } : undefined}
    >
      <Card
        className={`group relative overflow-hidden p-5 transition-all duration-300 ${
          status === "completed"
            ? "border-[oklch(0.72_0.19_145/0.3)] bg-[oklch(0.72_0.19_145/0.05)]"
            : status === "current"
              ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
              : "border-border/50 bg-muted/30 opacity-60"
        } ${isAccessible ? "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10" : "cursor-not-allowed"} ${
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        }`}
      >
        {/* Hover glow effect */}
        {isAccessible && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        {/* Status indicator */}
        <div className="absolute right-3 top-3">
          {status === "completed" ? (
            <motion.div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.72_0.19_145)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          ) : status === "current" ? (
            <motion.div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1] }}
              transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity }}
            >
              <Play className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Lesson number */}
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono text-sm font-bold text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {lesson.id + 1}
        </div>

        {/* Title */}
        <h3
          className={`mb-1 font-semibold transition-colors ${status === "locked" ? "text-muted-foreground" : "text-foreground group-hover:text-primary"}`}
        >
          {lesson.title}
        </h3>

        {/* Description */}
        <p className="mb-3 text-sm text-muted-foreground">{lesson.description}</p>

        {/* Duration */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lesson.duration}</span>
        </div>

        {/* Hover arrow */}
        {isAccessible && (
          <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        )}
      </Card>
    </motion.div>
  );

  if (isAccessible) {
    return <Link href={`/learn/${lesson.slug}`}>{cardContent}</Link>;
  }

  return cardContent;
}

export default function LearnDashboard() {
  const [completedLessons] = useCompletedLessons();
  const completionPercentage = getCompletionPercentage(completedLessons);
  const nextLesson = getNextUncompletedLesson(completedLessons);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const accessibleLessons = LESSONS.filter((_, i) => {
    const status = getLessonStatus(i, completedLessons);
    return status !== "locked";
  });

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < accessibleLessons.length - 1 ? prev + 1 : prev
          );
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < accessibleLessons.length) {
            const lesson = accessibleLessons[selectedIndex];
            router.push(`/learn/${lesson.slug}`);
          }
          break;
        case "Escape":
          setSelectedIndex(-1);
          break;
      }
    },
    [accessibleLessons, selectedIndex, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-cosmic opacity-50" />
      <div className="pointer-events-none fixed inset-0 bg-grid-pattern opacity-20" />

      {/* Floating orbs - hidden on mobile for performance */}
      <div className={backgrounds.orbCyan} />
      <div className={backgrounds.orbPink} />

      <div className="relative mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-12">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:block">
              Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">j</kbd>/<kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">k</kbd> to navigate
            </span>
            <Link
              href="/wizard/os-selection"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Terminal className="h-4 w-4" />
              <span className="text-sm">Setup Wizard</span>
            </Link>
          </div>
        </motion.div>

        {/* Hero section */}
        <motion.div
          className="mb-12 text-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { ...springs.smooth, delay: 0.1 }}
        >
          <motion.div
            className="mb-4 flex justify-center"
            initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...springs.bouncy, delay: 0.2 }}
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/20">
              <GraduationCap className="h-8 w-8 text-primary" />
              {/* Sparkle effect - respects reduced motion */}
              <Sparkles className={`absolute -right-1 -top-1 h-4 w-4 text-primary ${prefersReducedMotion ? "" : "animate-pulse"}`} />
            </div>
          </motion.div>
          <h1 className="mb-3 font-mono text-3xl font-bold tracking-tight md:text-4xl">
            Learning Hub
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Master your new agentic coding environment with these hands-on
            lessons. Start from the basics and work your way to advanced
            workflows.
          </p>
        </motion.div>

        {/* Progress card */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { ...springs.smooth, delay: 0.2 }}
        >
          <Card className="group relative mb-10 overflow-hidden border-primary/20 bg-primary/5 p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            {/* Subtle gradient glow on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[oklch(0.7_0.2_330/0.05)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Your Progress</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedLessons.length === TOTAL_LESSONS
                    ? "Congratulations! You've completed all lessons."
                    : nextLesson
                      ? `Up next: ${nextLesson.title}`
                      : "Start your learning journey"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Circular progress with animation */}
                <motion.div
                  className="relative h-16 w-16"
                  initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { ...springs.bouncy, delay: 0.3 }}
                >
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="3"
                    />
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={prefersReducedMotion ? { strokeDasharray: `${completionPercentage}, 100` } : { strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${completionPercentage}, 100` }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold">
                      {completionPercentage}%
                    </span>
                  </div>
                </motion.div>

                {/* Stats */}
                <div className="text-sm">
                  <motion.div
                    className="font-mono text-2xl font-bold text-primary"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { ...springs.smooth, delay: 0.4 }}
                  >
                    {completedLessons.length}/{TOTAL_LESSONS}
                  </motion.div>
                  <div className="text-muted-foreground">lessons complete</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-[oklch(0.7_0.2_330)]"
                  initial={prefersReducedMotion ? { width: `${completionPercentage}%` } : { width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Continue button */}
            {nextLesson && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: 0.6 }}
              >
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/learn/${nextLesson.slug}`}>
                    Continue Learning
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Lessons grid */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.3 }}
        >
          <h2 className="mb-4 text-xl font-semibold">All Lessons</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LESSONS.map((lesson, index) => {
              const status = getLessonStatus(lesson.id, completedLessons);
              // Find the accessible index for keyboard navigation
              const accessibleIndex = accessibleLessons.findIndex(
                (l) => l.id === lesson.id
              );
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  status={status}
                  index={index}
                  isSelected={accessibleIndex === selectedIndex}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Quick reference links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.5 }}
        >
          <Card className="group relative overflow-hidden p-6 transition-all duration-300 hover:border-primary/30">
            {/* Subtle hover glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <h2 className="relative mb-4 text-lg font-semibold">Quick Reference</h2>
            <div className="relative grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: "/learn/agent-commands",
                  icon: Terminal,
                  title: "Agent Commands",
                  desc: "Claude, Codex, Gemini shortcuts",
                },
                {
                  href: "/learn/ntm-palette",
                  icon: BookOpen,
                  title: "NTM Commands",
                  desc: "Session management reference",
                },
                {
                  href: "/learn/commands",
                  icon: List,
                  title: "Command Reference",
                  desc: "Searchable list of key commands",
                },
                {
                  href: "/learn/glossary",
                  icon: Book,
                  title: "Glossary",
                  desc: "Definitions for all jargon terms",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.smooth, delay: 0.6 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-12 pb-24 text-center text-sm text-muted-foreground sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.8 }}
        >
          <p>
            Need to set up your VPS first?{" "}
            <Link href="/wizard/os-selection" className="text-primary transition-colors hover:text-primary/80 hover:underline">
              Start the setup wizard →
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Mobile fixed bottom bar - thumb-zone friendly */}
      {nextLesson && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 p-4 backdrop-blur-lg sm:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ ...springs.smooth, delay: 0.5 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">Up next</p>
              <p className="truncate text-sm font-medium">{nextLesson.title}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/learn/${nextLesson.slug}`}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
