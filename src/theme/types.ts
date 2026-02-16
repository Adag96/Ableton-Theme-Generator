/** Theme tone controls derivation direction (light vs dark neutral ramp) */
export type ThemeTone = 'light' | 'dark';

/**
 * The 12 semantic color roles that define a theme.
 * Only tone, surface_base, text_primary, accent_primary, and accent_secondary
 * are required — the rest are derived automatically if omitted.
 */
export interface SemanticColorRoles {
  tone: ThemeTone;
  surface_base: string;
  text_primary: string;
  accent_primary: string;
  accent_secondary: string;
  surface_highlight?: string;
  surface_border?: string;
  detail_bg?: string;
  control_bg?: string;
  text_secondary?: string;
  selection_bg?: string;
  selection_fg?: string;
}

/** All 12 roles resolved — no optional fields after derivation */
export interface ResolvedColorRoles {
  tone: ThemeTone;
  surface_base: string;
  surface_highlight: string;
  surface_border: string;
  detail_bg: string;
  control_bg: string;
  text_primary: string;
  text_secondary: string;
  accent_primary: string;
  accent_secondary: string;
  selection_bg: string;
  selection_fg: string;
}

/**
 * 13-stop neutral lightness ramp derived from 3 anchor points:
 * control_bg (darkest in dark themes), surface_base (middle), text_primary (lightest).
 * Preserves hue/saturation from surface colors; only lightness varies.
 */
export interface NeutralScale {
  n0_deepest: string;    // L ~3%  (dark) — deepest foreground on accent
  n1_deep: string;       // L ~7%  — knobs, contrast frame
  n2_dark: string;       // L ~9%  — display/meter background
  n3_control: string;    // L ~12% — control_bg anchor
  n4_area: string;       // L ~15% — surface area, borders
  n5_border: string;     // L ~17% — desktop border
  n6_surface: string;    // L ~21% — surface_base anchor
  n7_detail: string;     // L ~24% — detail view background
  n8_highlight: string;  // L ~27% — surface_highlight anchor
  n9_mid_low: string;    // L ~37% — control fill handle, background clip
  n9b_mid: string;       // L ~41% — scrollbars, disabled foregrounds (#696969 dark)
  n10_mid: string;       // L ~46% — text_secondary anchor (disabled text)
  n11_mid_high: string;  // L ~53% — browser waveform, retro scale (#868686 dark)
  n11b_ruler: string;    // L ~57% — ruler markings, control selection frame (#919191 dark)
  n12_text: string;      // L ~71% — text_primary anchor
}

/** VU meter gradient definition (7 levels per meter type) */
export interface VuMeterGradient {
  onlyMinimumToMaximum: boolean;
  maximum: string;
  aboveZeroDecibel: string;
  zeroDecibel: string;
  belowZeroDecibel1: string;
  belowZeroDecibel2: string;
  minimum: string;
}

/** Blend factors and numeric parameters that differ between light/dark */
export interface BlendFactors {
  defaultBlendFactor: number;
  iconBlendFactor: number;
  clipBlendFactor: number;
  noteBorderStandbyBlendFactor: number;
  retroDisplayBlendFactor: number;
  checkControlNotCheckedBlendFactor: number;
  mixSurfaceAreaBlendFactor: number;
  textFrameSegmentBlendFactor: number;
  noteDisabledSelectedBlendFactor: number;
  minVelocityNoteBlendFactor: number;
  stripedBackgroundShadeFactor: number;
  nonEditableAutomationAlpha: number;
  disabledContextMenuIconAlpha: number;
  clipBorderAlpha: number;
  scrollBarAlpha: number;
  scrollBarOnHoverAlpha: number;
  scrollBarBackgroundAlpha: number;
  clipContrastColorAdjustment: number;
  sessionSlotOklabLCompensationFactor: number;
  inaudibleTakeLightness: number;
  inaudibleTakeSaturation: number;
  inaudibleTakeNameLightness: number;
  inaudibleTakeNameSaturation: number;
  automationLaneClipBodyLightness: number;
  automationLaneClipBodySaturation: number;
  automationLaneHeaderLightness: number;
  automationLaneHeaderSaturation: number;
  takeLaneHeaderLightness: number;
  takeLaneHeaderSaturation: number;
  takeLaneHeaderNameLightness: number;
  takeLaneHeaderNameSaturation: number;
  automationLaneHeaderNameLightness: number;
  automationLaneHeaderNameSaturation: number;
}

/** Complete resolved theme data ready for .ask generation */
export interface AbletonThemeData {
  roles: ResolvedColorRoles;
  neutralScale: NeutralScale;
  parameters: Record<string, string>;
  vuMeters: Record<string, VuMeterGradient>;
  blendFactors: BlendFactors;
}

/** Contrast validation result */
export interface ContrastIssue {
  foreground: string;
  background: string;
  foregroundRole: string;
  backgroundRole: string;
  ratio: number;
  required: number;
}

/** HSL color representation for internal calculations */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}
