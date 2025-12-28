import type { Metadata } from "next";

const siteUrl = "https://agent-flywheel.com";

export const metadata: Metadata = {
  title: "The Flywheel - Agent Flywheel",
  description:
    "Eight interconnected tools that enable multiple AI agents to work in parallel, review each other's work, and make incredible autonomous progress while you're away.",
  openGraph: {
    title: "The Flywheel - 8 Tools for 10x Velocity",
    description:
      "Eight interconnected tools that enable multiple AI agents to work in parallel. Using three tools is 10x better than one.",
    type: "website",
    url: `${siteUrl}/flywheel`,
    siteName: "Agent Flywheel",
    images: [
      {
        url: "/og-flywheel.jpg",
        width: 1200,
        height: 792,
        alt: "The Agent Flywheel - 8 Tools Working Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Flywheel - 8 Tools for 10x Velocity",
    description:
      "Eight interconnected tools that enable multiple AI agents to work in parallel. Using three tools is 10x better than one.",
    images: ["/og-flywheel.jpg"],
    creator: "@jeffreyemanuel",
  },
};

export default function FlywheelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
