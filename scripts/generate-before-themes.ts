/**
 * Generate "BEFORE" themes using the original algorithm (without ABL-25 changes)
 *
 * Usage: npx tsx scripts/generate-before-themes.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { generateTheme } from '../src/theme/derivation';
import { generateAskXml } from '../src/theme/ask-generator';
import { hexToHsl } from '../src/theme/color-utils';
import type { SemanticColorRoles } from '../src/theme/types';

const OUTPUT_DIR = 'test-themes/quality-comparison';

const testPalettes: Record<string, SemanticColorRoles> = {
  'high-saturation-red': {
    tone: 'dark',
    surface_base: '#8B2020',
    text_primary: '#E0E0E0',
    accent_primary: '#FFB74D',
    accent_secondary: '#4FC3F7',
  },
  'very-dark-base': {
    tone: 'dark',
    surface_base: '#141414',
    text_primary: '#D0D0D0',
    accent_primary: '#FF9800',
    accent_secondary: '#00BCD4',
  },
  'multi-color-harmony': {
    tone: 'dark',
    surface_base: '#2C3E50',
    text_primary: '#ECF0F1',
    accent_primary: '#E74C3C',
    accent_secondary: '#3498DB',
  },
  'pastel-muted': {
    tone: 'dark',
    surface_base: '#3D4F5F',
    text_primary: '#C8D0DC',
    accent_primary: '#E8943A',
    accent_secondary: '#3AB5C8',
  },
  'light-high-saturation': {
    tone: 'light',
    surface_base: '#FFE0E0',
    text_primary: '#1A1A1A',
    accent_primary: '#D32F2F',
    accent_secondary: '#1976D2',
  },
  'extended-palette': {
    tone: 'dark',
    surface_base: '#2D3440',
    text_primary: '#C8D0DC',
    accent_primary: '#E8943A',
    accent_secondary: '#3AB5C8',
  },
};

mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('Generating BEFORE themes (original algorithm)...\n');

for (const [name, roles] of Object.entries(testPalettes)) {
  const themeData = generateTheme(roles);
  const xml = generateAskXml(themeData);

  const surfaceHsl = hexToHsl(roles.surface_base);
  const highlightHsl = hexToHsl(themeData.roles.surface_highlight);
  const controlHsl = hexToHsl(themeData.roles.control_bg);

  console.log(`${name}-BEFORE:`);
  console.log(`  Surface L: ${surfaceHsl.l.toFixed(1)}%, S: ${surfaceHsl.s.toFixed(1)}%`);
  console.log(`  Highlight L: ${highlightHsl.l.toFixed(1)}% (spread: ${(highlightHsl.l - surfaceHsl.l).toFixed(1)}%)`);
  console.log(`  Control BG L: ${controlHsl.l.toFixed(1)}%`);

  const filename = `${OUTPUT_DIR}/${name}-BEFORE.ask`;
  writeFileSync(filename, xml, 'utf-8');
  console.log(`  Written: ${filename}\n`);
}

console.log('Done! Now restore ABL-25 changes and run generate-after-themes.ts');
