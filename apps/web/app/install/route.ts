import { NextResponse } from "next/server";

/**
 * GET /install
 *
 * Redirects to the raw install.sh script on GitHub.
 * This allows users to run: curl -fsSL https://agent-flywheel.com/install | bash
 *
 * The -L flag in curl follows redirects, so this works seamlessly.
 */
export async function GET() {
  const scriptUrl =
    "https://raw.githubusercontent.com/Dicklesworthstone/agentic_coding_flywheel_setup/main/install.sh";

  return NextResponse.redirect(scriptUrl, 302);
}
