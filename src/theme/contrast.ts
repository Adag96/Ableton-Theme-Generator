import type { ResolvedColorRoles, ContrastIssue } from './types';
import { contrastRatio, relativeLuminance, hexToHsl, hslToHex } from './color-utils';

interface ContrastRequirement {
  foregroundRole: keyof ResolvedColorRoles;
  backgroundRole: keyof ResolvedColorRoles;
  minRatio: number;
  label: string;
  /** Which role to adjust when contrast fails: 'foreground' (default) or 'background' */
  adjust?: 'foreground' | 'background';
}

/** WCAG-based contrast requirements for theme readability */
const CONTRAST_REQUIREMENTS: ContrastRequirement[] = [
  // Text on surface backgrounds (adjust foreground if needed)
  { foregroundRole: 'text_primary', backgroundRole: 'surface_base', minRatio: 4.5, label: 'Primary text on main background' },
  { foregroundRole: 'text_primary', backgroundRole: 'surface_highlight', minRatio: 4.5, label: 'Primary text on selected track' },
  { foregroundRole: 'text_primary', backgroundRole: 'detail_bg', minRatio: 4.5, label: 'Primary text on clip editor' },
  { foregroundRole: 'text_primary', backgroundRole: 'control_bg', minRatio: 4.5, label: 'Primary text on input fields' },
  { foregroundRole: 'text_secondary', backgroundRole: 'surface_base', minRatio: 3.0, label: 'Disabled text on main background' },
  { foregroundRole: 'text_secondary', backgroundRole: 'control_bg', minRatio: 3.0, label: 'Disabled text on inputs' },
  { foregroundRole: 'text_secondary', backgroundRole: 'surface_highlight', minRatio: 3.0, label: 'Disabled text on selected track' },
  // Selection
  { foregroundRole: 'selection_fg', backgroundRole: 'selection_bg', minRatio: 4.5, label: 'Selection text on selection highlight' },
  // Accents on surfaces (adjust accent if needed)
  { foregroundRole: 'accent_primary', backgroundRole: 'surface_base', minRatio: 3.0, label: 'Active toggle on main background' },
  { foregroundRole: 'accent_primary', backgroundRole: 'control_bg', minRatio: 3.0, label: 'Active toggle on input fields' },
  // Icons/text on accent backgrounds (adjust accent, not text)
  { foregroundRole: 'text_primary', backgroundRole: 'accent_primary', minRatio: 4.5, label: 'Icons on active toggles', adjust: 'background' },
  { foregroundRole: 'text_primary', backgroundRole: 'accent_secondary', minRatio: 4.5, label: 'Icons on secondary accent', adjust: 'background' },
];

/**
 * Validate all contrast requirements for a resolved color role set.
 * Returns an array of issues (empty = all pass).
 */
export function validateThemeContrast(roles: ResolvedColorRoles): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  for (const req of CONTRAST_REQUIREMENTS) {
    const fg = roles[req.foregroundRole] as string;
    const bg = roles[req.backgroundRole] as string;
    const ratio = contrastRatio(fg, bg);

    if (ratio < req.minRatio) {
      issues.push({
        foreground: fg,
        background: bg,
        foregroundRole: req.foregroundRole,
        backgroundRole: req.backgroundRole,
        ratio: Math.round(ratio * 100) / 100,
        required: req.minRatio,
      });
    }
  }

  return issues;
}

/**
 * Format contrast issues as a human-readable report.
 */
export function formatContrastReport(issues: ContrastIssue[]): string {
  if (issues.length === 0) return 'All contrast checks passed.';

  const lines = issues.map(issue =>
    `FAIL: ${issue.foregroundRole} (${issue.foreground}) on ${issue.backgroundRole} (${issue.background}) — ratio ${issue.ratio}:1, required ${issue.required}:1`
  );

  return `${issues.length} contrast issue(s):\n${lines.join('\n')}`;
}

/**
 * Find the minimum lightness adjustment needed to achieve target contrast.
 * Uses binary search to preserve as much of the original color as possible.
 */
function findMinimalAdjustment(
  fg: string,
  bg: string,
  targetRatio: number,
  direction: 1 | -1 // 1 = lighten, -1 = darken
): string {
  const fgHsl = hexToHsl(fg);
  let low = 0;
  let high = direction === 1 ? (100 - fgHsl.l) : fgHsl.l;
  let bestColor = fg;

  // Binary search for minimum delta that achieves target
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const newL = Math.max(0, Math.min(100, fgHsl.l + mid * direction));
    const candidate = hslToHex(fgHsl.h, fgHsl.s, newL);
    const ratio = contrastRatio(candidate, bg);

    if (ratio >= targetRatio) {
      bestColor = candidate;
      high = mid; // Try smaller adjustment
    } else {
      low = mid; // Need larger adjustment
    }
  }

  return bestColor;
}

/** Color roles that can be adjusted (excludes 'tone' and optional extended roles) */
type AdjustableColorRole = Exclude<keyof ResolvedColorRoles, 'tone' | 'surface_secondary' | 'accent_tertiary'>;

/**
 * Adjust colors to meet all contrast requirements.
 * Preserves hue and saturation; only nudges lightness as needed.
 * By default adjusts foreground; can adjust background when specified.
 */
export function adjustForContrast(roles: ResolvedColorRoles): ResolvedColorRoles {
  const adjusted = { ...roles };

  for (const req of CONTRAST_REQUIREMENTS) {
    const fgRole = req.foregroundRole as AdjustableColorRole;
    const bgRole = req.backgroundRole as AdjustableColorRole;
    const fg = adjusted[fgRole] as string;
    const bg = adjusted[bgRole] as string;

    // Skip if either color is not set (shouldn't happen for core roles)
    if (!fg || !bg) continue;

    if (contrastRatio(fg, bg) < req.minRatio) {
      const adjustBackground = req.adjust === 'background';
      const fgLum = relativeLuminance(fg);

      if (adjustBackground) {
        // Adjust background to contrast with foreground
        // Direction: if fg is dark, lighten bg; if fg is light, darken bg
        const direction: 1 | -1 = fgLum < 0.5 ? 1 : -1;
        (adjusted as Record<string, string>)[bgRole] = findMinimalAdjustment(bg, fg, req.minRatio, direction);
      } else {
        // Adjust foreground to contrast with background (default)
        const bgLum = relativeLuminance(bg);
        const direction: 1 | -1 = bgLum < 0.5 ? 1 : -1;
        (adjusted as Record<string, string>)[fgRole] = findMinimalAdjustment(fg, bg, req.minRatio, direction);
      }
    }
  }

  return adjusted;
}
