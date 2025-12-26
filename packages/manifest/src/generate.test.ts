/**
 * Tests for ACFS Manifest Generator outputs
 * Related: bead dvt.2
 *
 * Validates that generated scripts match expected content from real fixtures.
 * Uses actual acfs.manifest.yaml and validates against generated outputs.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { parseManifestFile } from './parser.js';
import {
  getCategories,
  getModuleCategory,
  sortModulesByInstallOrder,
  getTransitiveDependencies,
} from './utils.js';
import type { Manifest, Module } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'acfs.manifest.yaml');
const GENERATED_DIR = resolve(PROJECT_ROOT, 'scripts/generated');
const MANIFEST_INDEX_PATH = resolve(GENERATED_DIR, 'manifest_index.sh');

describe('Generated manifest_index.sh content', () => {
  let manifestIndexContent: string;
  let manifest: Manifest;

  beforeAll(() => {
    // Parse the real manifest
    const parseResult = parseManifestFile(MANIFEST_PATH);
    expect(parseResult.success).toBe(true);
    if (!parseResult.success || !parseResult.data) {
      throw new Error(`Failed to parse manifest: ${parseResult.error?.message}`);
    }
    manifest = parseResult.data;

    // Read the generated manifest_index.sh
    expect(existsSync(MANIFEST_INDEX_PATH)).toBe(true);
    manifestIndexContent = readFileSync(MANIFEST_INDEX_PATH, 'utf-8');
  });

  test('manifest_index.sh exists and is non-empty', () => {
    expect(manifestIndexContent.length).toBeGreaterThan(0);
  });

  test('contains auto-generated header', () => {
    expect(manifestIndexContent).toContain('AUTO-GENERATED FROM acfs.manifest.yaml');
    expect(manifestIndexContent).toContain('DO NOT EDIT');
  });

  test('contains ACFS_MANIFEST_SHA256', () => {
    expect(manifestIndexContent).toContain('ACFS_MANIFEST_SHA256=');
    // SHA256 is 64 hex characters
    const sha256Match = manifestIndexContent.match(/ACFS_MANIFEST_SHA256="([a-f0-9]{64})"/);
    expect(sha256Match).not.toBeNull();
  });

  test('contains ACFS_MODULES_IN_ORDER array', () => {
    expect(manifestIndexContent).toContain('ACFS_MODULES_IN_ORDER=(');
  });

  test('all modules are in ACFS_MODULES_IN_ORDER', () => {
    for (const module of manifest.modules) {
      expect(manifestIndexContent).toContain(`"${module.id}"`);
    }
  });

  test('modules are in dependency-respecting order', () => {
    // Extract the order from the file
    const orderMatch = manifestIndexContent.match(
      /ACFS_MODULES_IN_ORDER=\(\s*([\s\S]*?)\s*\)/
    );
    expect(orderMatch).not.toBeNull();

    const orderContent = orderMatch![1];
    const moduleIds = orderContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('"') && line.endsWith('"'))
      .map((line) => line.slice(1, -1));

    // Verify each module appears after its dependencies
    const moduleIndex = new Map(moduleIds.map((id, idx) => [id, idx]));

    for (const module of manifest.modules) {
      if (module.dependencies) {
        const moduleIdx = moduleIndex.get(module.id);
        expect(moduleIdx).toBeDefined();

        for (const dep of module.dependencies) {
          const depIdx = moduleIndex.get(dep);
          expect(depIdx).toBeDefined();
          expect(depIdx!).toBeLessThan(moduleIdx!);
        }
      }
    }
  });

  test('contains ACFS_MODULE_PHASE associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_PHASE=(');
  });

  test('all modules have phase entries', () => {
    for (const module of manifest.modules) {
      const expectedPhase = module.phase ?? 1;
      // Generator emits associative-array keys as `[module.id]` (unquoted, safe for our IDs).
      expect(manifestIndexContent).toContain(`[${module.id}]="${expectedPhase}"`);
    }
  });

  test('contains ACFS_MODULE_DEPS associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_DEPS=(');
  });

  test('dependencies are correctly formatted', () => {
    for (const module of manifest.modules) {
      const deps = module.dependencies?.join(',') ?? '';
      // Generator emits associative-array keys as `[module.id]` (unquoted, safe for our IDs).
      expect(manifestIndexContent).toContain(`[${module.id}]="${deps}"`);
    }
  });

  test('contains ACFS_MODULE_FUNC associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_FUNC=(');
  });

  test('function names follow convention', () => {
    for (const module of manifest.modules) {
      const expectedFunc = `install_${module.id.replace(/\./g, '_')}`;
      // Generator emits associative-array keys as `[module.id]` (unquoted, safe for our IDs).
      expect(manifestIndexContent).toContain(`[${module.id}]="${expectedFunc}"`);
    }
  });

  test('contains ACFS_MODULE_CATEGORY associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_CATEGORY=(');
  });

  test('categories are correctly derived from module IDs', () => {
    for (const module of manifest.modules) {
      const category = module.category ?? getModuleCategory(module.id);
      // Generator emits associative-array keys as `[module.id]` (unquoted, safe for our IDs).
      expect(manifestIndexContent).toContain(`[${module.id}]="${category}"`);
    }
  });

  test('contains ACFS_MODULE_TAGS associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_TAGS=(');
  });

  test('contains ACFS_MODULE_DEFAULT associative array', () => {
    expect(manifestIndexContent).toContain('declare -gA ACFS_MODULE_DEFAULT=(');
  });

  test('default values match manifest', () => {
    for (const module of manifest.modules) {
      const expectedDefault = module.enabled_by_default ? '1' : '0';
      // Generator emits associative-array keys as `[module.id]` (unquoted, safe for our IDs).
      expect(manifestIndexContent).toContain(`[${module.id}]="${expectedDefault}"`);
    }
  });

  test('contains ACFS_MANIFEST_INDEX_LOADED flag', () => {
    expect(manifestIndexContent).toContain('ACFS_MANIFEST_INDEX_LOADED=true');
  });
});

describe('Generated category scripts exist', () => {
  let manifest: Manifest;

  beforeAll(() => {
    const parseResult = parseManifestFile(MANIFEST_PATH);
    if (parseResult.success && parseResult.data) {
      manifest = parseResult.data;
    }
  });

  test('category install scripts exist for each category', () => {
    const categories = getCategories(manifest);

    for (const category of categories) {
      const categoryPath = resolve(GENERATED_DIR, `install_${category}.sh`);
      expect(existsSync(categoryPath)).toBe(true);
    }
  });

  test('doctor_checks.sh exists', () => {
    const doctorPath = resolve(GENERATED_DIR, 'doctor_checks.sh');
    expect(existsSync(doctorPath)).toBe(true);
  });

  test('install_all.sh exists', () => {
    const installAllPath = resolve(GENERATED_DIR, 'install_all.sh');
    expect(existsSync(installAllPath)).toBe(true);
  });
});

describe('doctor_checks.sh content', () => {
  let doctorContent: string;
  let manifest: Manifest;

  beforeAll(() => {
    const parseResult = parseManifestFile(MANIFEST_PATH);
    if (parseResult.success && parseResult.data) {
      manifest = parseResult.data;
    }

    const doctorPath = resolve(GENERATED_DIR, 'doctor_checks.sh');
    doctorContent = readFileSync(doctorPath, 'utf-8');
  });

  test('contains MANIFEST_CHECKS array', () => {
    expect(doctorContent).toContain('declare -a MANIFEST_CHECKS=(');
  });

  test('contains run_manifest_checks function', () => {
    expect(doctorContent).toContain('run_manifest_checks()');
  });

  test('all modules have at least one verify check', () => {
    for (const module of manifest.modules) {
      // Each module should have entries in the checks
      expect(doctorContent).toContain(module.id);
    }
  });

  test('uses tab delimiter for check entries', () => {
    // The format is: ID<TAB>DESCRIPTION<TAB>CHECK_COMMAND<TAB>REQUIRED/OPTIONAL
    // Tab character should be present in the entries
    expect(doctorContent).toContain('\\t');
  });

  test('multiline verify commands are encoded as single-line records', () => {
    // lang.nvm verify is a YAML literal block (multi-line). The generator must encode it
    // so the MANIFEST_CHECKS record stays on one line and can be parsed via read/IFS.
    const nvmLine = doctorContent.match(/^    "lang\.nvm[^\n]*"$/m);
    expect(nvmLine).not.toBeNull();
    expect(nvmLine![0]).toContain('\\\\n');
  });
});

describe('Utils: sortModulesByInstallOrder', () => {
  let manifest: Manifest;

  beforeAll(() => {
    const parseResult = parseManifestFile(MANIFEST_PATH);
    if (parseResult.success && parseResult.data) {
      manifest = parseResult.data;
    }
  });

  test('returns all modules', () => {
    const sorted = sortModulesByInstallOrder(manifest);
    expect(sorted.length).toBe(manifest.modules.length);
  });

  test('dependencies come before dependents', () => {
    const sorted = sortModulesByInstallOrder(manifest);
    const indexMap = new Map(sorted.map((m, i) => [m.id, i]));

    for (const module of manifest.modules) {
      if (module.dependencies) {
        const moduleIdx = indexMap.get(module.id)!;
        for (const dep of module.dependencies) {
          const depIdx = indexMap.get(dep);
          expect(depIdx).toBeDefined();
          expect(depIdx!).toBeLessThan(moduleIdx);
        }
      }
    }
  });

  test('respects phase ordering', () => {
    const sorted = sortModulesByInstallOrder(manifest);

    // Group by phase
    const phaseGroups = new Map<number, Module[]>();
    for (const module of sorted) {
      const phase = module.phase ?? 1;
      const group = phaseGroups.get(phase) ?? [];
      group.push(module);
      phaseGroups.set(phase, group);
    }

    // Phases should appear in order
    let lastPhase = 0;
    for (const module of sorted) {
      const phase = module.phase ?? 1;
      expect(phase).toBeGreaterThanOrEqual(lastPhase);
      lastPhase = phase;
    }
  });
});

describe('Utils: getTransitiveDependencies', () => {
  let manifest: Manifest;

  beforeAll(() => {
    const parseResult = parseManifestFile(MANIFEST_PATH);
    if (parseResult.success && parseResult.data) {
      manifest = parseResult.data;
    }
  });

  test('returns empty for module with no dependencies', () => {
    const deps = getTransitiveDependencies(manifest, 'base.system');
    // base.system typically has no dependencies
    const baseModule = manifest.modules.find((m) => m.id === 'base.system');
    if (!baseModule?.dependencies?.length) {
      expect(deps.length).toBe(0);
    }
  });

  test('includes all transitive dependencies', () => {
    // Find a module with nested dependencies
    // agents.codex -> lang.bun -> base.system
    const codexDeps = getTransitiveDependencies(manifest, 'agents.codex');

    // Should include lang.bun and base.system
    const depIds = codexDeps.map((d) => d.id);
    expect(depIds).toContain('lang.bun');
    expect(depIds).toContain('base.system');
  });

  test('handles diamond dependencies without duplicates', () => {
    // Find any module that has shared dependencies
    const allDeps = getTransitiveDependencies(manifest, 'stack.ultimate_bug_scanner');
    const depIds = allDeps.map((d) => d.id);

    // No duplicates
    const uniqueIds = new Set(depIds);
    expect(uniqueIds.size).toBe(depIds.length);
  });

  test('returns empty for non-existent module', () => {
    const deps = getTransitiveDependencies(manifest, 'nonexistent.module');
    expect(deps.length).toBe(0);
  });
});

describe('Utils: getCategories', () => {
  let manifest: Manifest;

  beforeAll(() => {
    const parseResult = parseManifestFile(MANIFEST_PATH);
    if (parseResult.success && parseResult.data) {
      manifest = parseResult.data;
    }
  });

  test('returns all unique categories', () => {
    const categories = getCategories(manifest);

    // Expected categories based on manifest
    const expectedCategories = ['base', 'users', 'shell', 'cli', 'lang', 'tools', 'agents', 'db', 'cloud', 'stack', 'acfs'];

    for (const cat of expectedCategories) {
      expect(categories).toContain(cat);
    }
  });

  test('returns no duplicates', () => {
    const categories = getCategories(manifest);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(categories.length);
  });
});

describe('Generated script headers', () => {
  test('all generated scripts have consistent header', () => {
    const categories = ['base', 'lang', 'agents', 'stack'];

    for (const category of categories) {
      const scriptPath = resolve(GENERATED_DIR, `install_${category}.sh`);
      if (existsSync(scriptPath)) {
        const content = readFileSync(scriptPath, 'utf-8');

        // Check for standard header elements
        expect(content).toContain('#!/usr/bin/env bash');
        expect(content).toContain('AUTO-GENERATED');
        expect(content).toContain('set -euo pipefail');
      }
    }
  });

  test('generated scripts source logging.sh', () => {
    const scriptPath = resolve(GENERATED_DIR, 'install_lang.sh');
    if (existsSync(scriptPath)) {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('source "$ACFS_GENERATED_SCRIPT_DIR/../lib/logging.sh"');
    }
  });

  test('generated scripts source install_helpers.sh', () => {
    const scriptPath = resolve(GENERATED_DIR, 'install_agents.sh');
    if (existsSync(scriptPath)) {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('source "$ACFS_GENERATED_SCRIPT_DIR/../lib/install_helpers.sh"');
    }
  });
});
