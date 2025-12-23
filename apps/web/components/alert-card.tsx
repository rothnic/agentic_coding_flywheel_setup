"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error" | "tip" | "magic";

interface AlertCardProps {
  variant?: AlertVariant;
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; title: string; defaultIcon: LucideIcon }
> = {
  info: {
    container:
      "border-[oklch(0.75_0.18_195/0.3)] bg-[oklch(0.75_0.18_195/0.08)]",
    icon: "text-[oklch(0.75_0.18_195)]",
    title: "text-[oklch(0.85_0.12_195)]",
    defaultIcon: Info,
  },
  success: {
    container:
      "border-[oklch(0.72_0.19_145/0.3)] bg-[oklch(0.72_0.19_145/0.08)]",
    icon: "text-[oklch(0.72_0.19_145)]",
    title: "text-[oklch(0.82_0.12_145)]",
    defaultIcon: CheckCircle2,
  },
  warning: {
    container:
      "border-[oklch(0.78_0.16_75/0.3)] bg-[oklch(0.78_0.16_75/0.08)]",
    icon: "text-[oklch(0.78_0.16_75)]",
    title: "text-[oklch(0.88_0.12_75)]",
    defaultIcon: AlertTriangle,
  },
  error: {
    container:
      "border-[oklch(0.65_0.22_25/0.3)] bg-[oklch(0.65_0.22_25/0.08)]",
    icon: "text-[oklch(0.65_0.22_25)]",
    title: "text-[oklch(0.75_0.15_25)]",
    defaultIcon: AlertCircle,
  },
  tip: {
    container:
      "border-[oklch(0.7_0.2_330/0.3)] bg-[oklch(0.7_0.2_330/0.08)]",
    icon: "text-[oklch(0.7_0.2_330)]",
    title: "text-[oklch(0.8_0.15_330)]",
    defaultIcon: Info,
  },
  magic: {
    container:
      "border-primary/30 bg-primary/[0.08] shadow-sm shadow-primary/10",
    icon: "text-primary",
    title: "text-primary",
    defaultIcon: Sparkles,
  },
};

/**
 * A premium alert card component with consistent OKLCH design system styling.
 * Use for info boxes, success messages, warnings, and tips in wizard pages.
 */
export function AlertCard({
  variant = "info",
  icon,
  title,
  children,
  className,
}: AlertCardProps) {
  const styles = variantStyles[variant];
  const IconComponent = icon || styles.defaultIcon;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 backdrop-blur-sm transition-all",
        styles.container,
        className
      )}
    >
      <div className="flex gap-3">
        <IconComponent
          className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)}
        />
        <div className="min-w-0 flex-1 space-y-1">
          {title && (
            <p className={cn("font-medium", styles.title)}>{title}</p>
          )}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * A code output preview card, like showing expected terminal output.
 */
export function OutputPreview({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[oklch(0.72_0.19_145/0.3)] bg-[oklch(0.72_0.19_145/0.08)] p-4 backdrop-blur-sm",
        className
      )}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[oklch(0.72_0.19_145)]" />
          <span className="font-medium text-[oklch(0.82_0.12_145)]">
            {title}
          </span>
        </div>
      )}
      <div className="rounded-lg bg-[oklch(0.08_0.015_260)] p-3 font-mono text-sm">
        {children}
      </div>
    </div>
  );
}

/**
 * A collapsible details section with premium styling.
 */
export function DetailsSection({
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  summary: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className={cn(
        "group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all",
        "hover:border-primary/20",
        className
      )}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="border-t border-border/30 px-4 py-3">{children}</div>
    </details>
  );
}
