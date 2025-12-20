/**
 * ACFS Manifest Types
 * Type definitions for the acfs.manifest.yaml schema
 */

/**
 * Default configuration for ACFS installation
 */
export interface ManifestDefaults {
  /** Target user for installation (default: ubuntu) */
  user: string;
  /** Root directory for projects workspace */
  workspace_root: string;
  /** Installation mode (vibe = passwordless sudo, full permissions) */
  mode: 'vibe' | 'safe';
}

/**
 * A single module in the manifest
 * Modules represent installable tools, packages, or configurations
 */
export interface Module {
  /** Unique identifier for the module (e.g., "shell.zsh", "lang.bun") */
  id: string;
  /** Human-readable description of what this module provides */
  description: string;
  /** Installation commands to run (shell commands or descriptions) */
  install: string[];
  /** Verification commands to check if installation succeeded */
  verify: string[];
  /** Optional notes about the module */
  notes?: string[];
  /** Optional documentation URL */
  docs_url?: string;
  /** Module IDs this module depends on */
  dependencies?: string[];
  /** Optional aliases this module creates */
  aliases?: string[];
}

/**
 * The complete ACFS manifest
 */
export interface Manifest {
  /** Schema version number */
  version: number;
  /** Project name */
  name: string;
  /** Short identifier */
  id: string;
  /** Default configuration values */
  defaults: ManifestDefaults;
  /** List of all modules */
  modules: Module[];
}

/**
 * Result of manifest validation
 */
export interface ValidationResult {
  /** Whether the manifest is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors: ValidationError[];
  /** Validation warnings (non-fatal issues) */
  warnings: ValidationWarning[];
}

/**
 * A validation error
 */
export interface ValidationError {
  /** Path to the invalid field */
  path: string;
  /** Error message */
  message: string;
  /** The invalid value (if available) */
  value?: unknown;
}

/**
 * A validation warning
 */
export interface ValidationWarning {
  /** Path to the field with the warning */
  path: string;
  /** Warning message */
  message: string;
}

/**
 * Module category derived from module ID prefix
 */
export type ModuleCategory =
  | 'base'
  | 'users'
  | 'shell'
  | 'cli'
  | 'lang'
  | 'tools'
  | 'db'
  | 'cloud'
  | 'agents'
  | 'stack'
  | 'acfs';

/**
 * Parse result from YAML parsing
 */
export interface ParseResult<T> {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed data (if successful) */
  data?: T;
  /** Parse error (if failed) */
  error?: ParseError;
}

/**
 * A parsing error
 */
export interface ParseError {
  /** Error message */
  message: string;
  /** Line number (if available) */
  line?: number;
  /** Column number (if available) */
  column?: number;
}
