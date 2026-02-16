import type { ResolvedColorRoles, ContrastIssue } from './types';
import { contrastRatio } from './color-utils';

interface ContrastRequirement {
  foregroundRole: keyof ResolvedColorRoles;
  backgroundRole: keyof ResolvedColorRoles;
  minRatio: number;
  label: string;
}

/** WCAG-based contrast requirements for theme readability */
const CONTRAST_REQUIREMENTS: ContrastRequirement[] = [
  { foregroundRole: 'text_primary', backgroundRole: 'surface_base', minRatio: 4.5, label: 'Primary text on main background' },
  { foregroundRole: 'text_primary', backgroundRole: 'surface_highlight', minRatio: 4.5, label: 'Primary text on selected track' },
  { foregroundRole: 'text_primary', backgroundRole: 'detail_bg', minRatio: 4.5, label: 'Primary text on clip editor' },
  { foregroundRole: 'text_primary', backgroundRole: 'control_bg', minRatio: 4.5, label: 'Primary text on input fields' },
  { foregroundRole: 'text_secondary', backgroundRole: 'surface_base', minRatio: 3.0, label: 'Disabled text on main background' },
  { foregroundRole: 'selection_fg', backgroundRole: 'selection_bg', minRatio: 4.5, label: 'Selection text on selection highlight' },
  { foregroundRole: 'accent_primary', backgroundRole: 'surface_base', minRatio: 3.0, label: 'Active toggle on main background' },
  { foregroundRole: 'accent_primary', backgroundRole: 'control_bg', minRatio: 3.0, label: 'Active toggle on input fields' },
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
