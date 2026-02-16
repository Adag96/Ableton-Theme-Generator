/**
 * Test script: generates a theme .ask file from 5 input colors.
 * Also validates contrast and generates a reference dark neutral theme for comparison.
 *
 * Usage: npx tsx scripts/generate-test-theme.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { generateTheme } from '../src/theme/derivation';
import { generateAskXml } from '../src/theme/ask-generator';
import { validateThemeContrast, formatContrastReport } from '../src/theme/contrast';
import type { SemanticColorRoles } from '../src/theme/types';

// --- Test palette: "Steel Blue" dark theme ---
const steelBlue: SemanticColorRoles = {
  tone: 'dark',
  surface_base: '#2d3440',
  text_primary: '#c8d0dc',
  accent_primary: '#e8943a',
  accent_secondary: '#3ab5c8',
};

// --- Reference: reproduce the Default Dark Neutral Medium ---
const darkNeutral: SemanticColorRoles = {
  tone: 'dark',
  surface_base: '#363636',
  surface_highlight: '#464646',
  surface_border: '#2a2a2a',
  detail_bg: '#3e3e3e',
  control_bg: '#1e1e1e',
  text_primary: '#b5b5b5',
  text_secondary: '#757575',
  accent_primary: '#ffad56',
  accent_secondary: '#03c3d5',
  selection_bg: '#b0ddeb',
  selection_fg: '#070707',
};

function generate(name: string, input: SemanticColorRoles) {
  console.log(`\n=== Generating: ${name} ===`);

  const themeData = generateTheme(input);

  // Contrast validation
  const issues = validateThemeContrast(themeData.roles);
  console.log(formatContrastReport(issues));

  // Log resolved roles
  console.log('\nResolved roles:');
  for (const [key, value] of Object.entries(themeData.roles)) {
    console.log(`  ${key}: ${value}`);
  }

  // Log neutral scale
  console.log('\nNeutral scale:');
  for (const [key, value] of Object.entries(themeData.neutralScale)) {
    console.log(`  ${key}: ${value}`);
  }

  // Generate XML
  const xml = generateAskXml(themeData);
  const paramCount = Object.keys(themeData.parameters).length;
  console.log(`\nGenerated ${paramCount} color parameters`);

  // Write file
  mkdirSync('test-themes', { recursive: true });
  const filename = `test-themes/${name}.ask`;
  writeFileSync(filename, xml, 'utf-8');
  console.log(`Written to: ${filename}`);

  return xml;
}

// Generate both themes
generate('Steel-Blue-Dark', steelBlue);
generate('Dark-Neutral-Reference', darkNeutral);

console.log('\nDone! Load the .ask files in Ableton Live 12 to test.');
