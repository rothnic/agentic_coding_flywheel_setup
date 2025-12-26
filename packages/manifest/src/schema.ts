/**
 * ACFS Manifest Schema
 * Zod schema definitions for validating manifest files
 */

import { z } from 'zod';

/**
 * Schema for manifest defaults
 */
export const ManifestDefaultsSchema = z.object({
  user: z.string().min(1, 'User cannot be empty'),
  workspace_root: z.string().min(1, 'Workspace root cannot be empty'),
  mode: z.enum(['vibe', 'safe']).default('vibe'),
});

/**
 * Schema for a single module
 */
const RunAsSchema = z.enum(['target_user', 'root', 'current']);

/**
 * Allowlist of verified installer runners.
 * SECURITY: Only allow known-safe shell interpreters to prevent command injection.
 * Expand only if there is a concrete, vetted need.
 */
const VerifiedInstallerRunnerSchema = z.enum(['bash', 'sh'], {
  errorMap: () => ({
    message: 'verified_installer.runner must be "bash" or "sh" (security: runner allowlist)',
  }),
});

export const ModuleSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Module ID cannot be empty')
      .regex(
        /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/,
        'Module ID must be lowercase with dots (e.g., "shell.zsh", "lang.bun")'
      ),
    description: z.string().min(1, 'Description cannot be empty'),

    category: z.string().optional(),

    // Execution context
    run_as: RunAsSchema.default('target_user'),

    // Verified installer reference
    verified_installer: z
      .object({
        tool: z
          .string()
          .min(1, 'Verified installer tool cannot be empty')
          .regex(
            /^[a-z][a-z0-9_]*$/,
            'Tool name must be lowercase alphanumeric with underscores (e.g., "bun", "claude", "mcp_agent_mail")'
          ),
        runner: VerifiedInstallerRunnerSchema,
        args: z.array(z.string()).default([]),
        // Fallback URL for direct install if verified install fails
        // This provides graceful degradation when security verification isn't available
        fallback_url: z.string().url().optional(),
        // Run installer in detached tmux session (prevents blocking for long-running services)
        run_in_tmux: z.boolean().default(false),
      })
      .optional(),

    // Installation behavior
    optional: z.boolean().default(false),
    enabled_by_default: z.boolean().default(true),
    installed_check: z
      .object({
        run_as: RunAsSchema.default('target_user'),
        command: z.string().min(1, 'Installed check command cannot be empty'),
      })
      .optional(),
    generated: z.boolean().default(true),

    phase: z.number().int().min(1).max(10).optional(),

    // Install steps are shell strings (executed via run_as_*_shell).
    // Allow empty when verified_installer is provided.
    install: z.array(z.string()).default([]),
    verify: z.array(z.string()).min(1, 'At least one verify command required'),
    dependencies: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    docs_url: z.string().url().optional(),
    aliases: z.array(z.string()).optional(),
  })
  .refine(
    (module) =>
      module.generated === false ||
      module.verified_installer !== undefined ||
      module.install.length > 0,
    {
      message:
        'Module must define verified_installer or install commands (or set generated: false).',
    }
  );

/**
 * Schema for the complete manifest
 */
export const ManifestSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  name: z.string().min(1, 'Name cannot be empty'),
  id: z
    .string()
    .min(1, 'ID cannot be empty')
    .regex(/^[a-z][a-z0-9_]*$/, 'ID must be lowercase alphanumeric with underscores'),
  defaults: ManifestDefaultsSchema,
  modules: z.array(ModuleSchema).min(1, 'At least one module required'),
});

/**
 * Type inference from schemas
 */
export type ManifestDefaultsInput = z.input<typeof ManifestDefaultsSchema>;
export type ManifestDefaultsOutput = z.output<typeof ManifestDefaultsSchema>;

export type ModuleInput = z.input<typeof ModuleSchema>;
export type ModuleOutput = z.output<typeof ModuleSchema>;

export type ManifestInput = z.input<typeof ManifestSchema>;
export type ManifestOutput = z.output<typeof ManifestSchema>;
