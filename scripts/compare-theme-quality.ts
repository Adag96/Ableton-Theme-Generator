/**
 * ABL-25: Theme Quality Comparison Script
 *
 * Generates themes using hard-coded test palettes to compare before/after algorithm changes.
 * For full image-based testing, use the app's UI.
 *
 * Usage: npx tsx scripts/compare-theme-quality.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { generateTheme } from '../src/theme/derivation';
import { generateAskXml } from '../src/theme/ask-generator';
import { validateThemeContrast, formatContrastReport } from '../src/theme/contrast';
import type { SemanticColorRoles } from '../src/theme/types';

// Output directory
const OUTPUT_DIR = 'test-themes/quality-comparison';

/**
 * Test palettes representing different scenarios
 */
const testPalettes: Record<string, { description: string; roles: SemanticColorRoles }> = {
  // Scenario 1: High saturation surface (should be desaturated by new algorithm)
  'high-saturation-red': {
    description: 'Tests surface saturation filtering - bright red should be desaturated',
    roles: {
      tone: 'dark',
      surface_base: '#8B2020', // Bright red that should NOT be used as-is
      text_primary: '#E0E0E0',
      accent_primary: '#FFB74D',
      accent_secondary: '#4FC3F7',
    },
  },

  // Scenario 2: Very dark surface (should trigger lightness spread enforcement)
  'very-dark-base': {
    description: 'Tests minimum lightness spread - L=8% base should have visible highlight',
    roles: {
      tone: 'dark',
      surface_base: '#141414', // L ≈ 8%, very dark
      text_primary: '#D0D0D0',
      accent_primary: '#FF9800',
      accent_secondary: '#00BCD4',
    },
  },

  // Scenario 3: Multi-color with harmony potential
  'multi-color-harmony': {
    description: 'Tests harmony scoring - should prefer colors with good angular relationships',
    roles: {
      tone: 'dark',
      surface_base: '#2C3E50', // Blue-gray base
      text_primary: '#ECF0F1',
      accent_primary: '#E74C3C', // Red accent (~0°)
      accent_secondary: '#3498DB', // Blue accent (~210°) - near-complementary
    },
  },

  // Scenario 4: Pastel/muted (should already work well)
  'pastel-muted': {
    description: 'Baseline - muted colors should produce good results',
    roles: {
      tone: 'dark',
      surface_base: '#3D4F5F', // Desaturated blue-gray
      text_primary: '#C8D0DC',
      accent_primary: '#E8943A', // Muted orange
      accent_secondary: '#3AB5C8', // Muted cyan
    },
  },

  // Scenario 5: Light theme with high saturation
  'light-high-saturation': {
    description: 'Light theme with potentially aggressive surface color',
    roles: {
      tone: 'light',
      surface_base: '#FFE0E0', // Pinkish - might be too saturated
      text_primary: '#1A1A1A',
      accent_primary: '#D32F2F',
      accent_secondary: '#1976D2',
    },
  },

  // Scenario 6: Extended palette (6 colors) test
  'extended-palette': {
    description: 'Tests 6-color palette with surface_secondary and accent_tertiary',
    roles: {
      tone: 'dark',
      surface_base: '#2D3440', // Steel blue base
      text_primary: '#C8D0DC',
      accent_primary: '#E8943A', // Orange
      accent_secondary: '#3AB5C8', // Cyan
      surface_secondary: '#3D4F5F', // Slightly different surface
      accent_tertiary: '#9C27B0', // Purple
    },
  },
};

interface ThemeMetrics {
  surfaceSaturation: number;
  surfaceLightness: number;
  highlightLightness: number;
  highlightSpread: number;
  controlBgLightness: number;
  contrastIssueCount: number;
}

function extractMetrics(roles: SemanticColorRoles, resolved: Record<string, unknown>): ThemeMetrics {
  // Parse HSL from the original surface_base
  const surfaceMatch = roles.surface_base.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  let surfaceSaturation = 0;
  let surfaceLightness = 0;

  if (surfaceMatch) {
    const r = parseInt(surfaceMatch[1], 16) / 255;
    const g = parseInt(surfaceMatch[2], 16) / 255;
    const b = parseInt(surfaceMatch[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    surfaceLightness = ((max + min) / 2) * 100;
    if (max !== min) {
      const d = max - min;
      surfaceSaturation = surfaceLightness > 50
        ? (d / (2 - max - min)) * 100
        : (d / (max + min)) * 100;
    }
  }

  // Parse resolved colors
  const parseL = (hex: string): number => {
    const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (!match) return 0;
    const r = parseInt(match[1], 16) / 255;
    const g = parseInt(match[2], 16) / 255;
    const b = parseInt(match[3], 16) / 255;
    return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100;
  };

  const resolvedSurfaceL = parseL(resolved.surface_base as string);
  const highlightL = parseL(resolved.surface_highlight as string);
  const controlL = parseL(resolved.control_bg as string);

  return {
    surfaceSaturation: Math.round(surfaceSaturation),
    surfaceLightness: Math.round(surfaceLightness),
    highlightLightness: Math.round(highlightL),
    highlightSpread: Math.round(highlightL - resolvedSurfaceL),
    controlBgLightness: Math.round(controlL),
    contrastIssueCount: 0, // Will be set after validation
  };
}

function generate(name: string, description: string, input: SemanticColorRoles): ThemeMetrics {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Theme: ${name}`);
  console.log(`Description: ${description}`);
  console.log('='.repeat(60));

  const themeData = generateTheme(input);

  // Extract metrics
  const metrics = extractMetrics(input, themeData.roles as unknown as Record<string, unknown>);

  // Contrast validation
  const issues = validateThemeContrast(themeData.roles);
  metrics.contrastIssueCount = issues.length;
  console.log(formatContrastReport(issues));

  // Log key metrics
  console.log('\nKey Metrics:');
  console.log(`  Input Surface Saturation: ${metrics.surfaceSaturation}%`);
  console.log(`  Input Surface Lightness: ${metrics.surfaceLightness}%`);
  console.log(`  Resolved Highlight Lightness: ${metrics.highlightLightness}%`);
  console.log(`  Highlight Spread: ${metrics.highlightSpread}%`);
  console.log(`  Control BG Lightness: ${metrics.controlBgLightness}%`);
  console.log(`  Contrast Issues: ${metrics.contrastIssueCount}`);

  // Log resolved roles
  console.log('\nResolved Roles:');
  for (const [key, value] of Object.entries(themeData.roles)) {
    console.log(`  ${key}: ${value}`);
  }

  // Generate XML
  const xml = generateAskXml(themeData);
  const filename = `${OUTPUT_DIR}/${name}.ask`;
  writeFileSync(filename, xml, 'utf-8');
  console.log(`\nWritten to: ${filename}`);

  return metrics;
}

// Main execution
console.log('ABL-25: Theme Quality Comparison');
console.log('================================\n');

// Create output directory
mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate all test themes
const results: Record<string, ThemeMetrics> = {};

for (const [name, { description, roles }] of Object.entries(testPalettes)) {
  results[name] = generate(name, description, roles);
}

// Summary report
console.log('\n\n' + '='.repeat(60));
console.log('SUMMARY REPORT');
console.log('='.repeat(60));
console.log('\n| Theme | Surface S% | Highlight Spread | Control L% | Issues |');
console.log('|-------|------------|------------------|------------|--------|');

for (const [name, metrics] of Object.entries(results)) {
  console.log(
    `| ${name.padEnd(20).slice(0, 20)} | ${String(metrics.surfaceSaturation).padStart(10)}% | ${String(metrics.highlightSpread).padStart(16)}% | ${String(metrics.controlBgLightness).padStart(10)}% | ${String(metrics.contrastIssueCount).padStart(6)} |`
  );
}

console.log('\n\nDone! Load the .ask files in Ableton Live 12 to compare visually.');
console.log(`Output directory: ${OUTPUT_DIR}`);
