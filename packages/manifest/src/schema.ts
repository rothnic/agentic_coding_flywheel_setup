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
export const ModuleSchema = z.object({
  id: z
    .string()
    .min(1, 'Module ID cannot be empty')
    .regex(
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/,
      'Module ID must be lowercase with dots (e.g., "shell.zsh", "lang.bun")'
    ),
  description: z.string().min(1, 'Description cannot be empty'),
  install: z.array(z.string()).min(1, 'At least one install command required'),
  verify: z.array(z.string()).min(1, 'At least one verify command required'),
  notes: z.array(z.string()).optional(),
  docs_url: z.string().url().optional(),
  dependencies: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
});

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
