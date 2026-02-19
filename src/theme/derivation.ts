import type {
  SemanticColorRoles,
  ResolvedColorRoles,
  NeutralScale,
  BlendFactors,
  AbletonThemeData,
  VuMeterGradient,
  ContrastLevel,
} from './types';
import { CONTRAST_MULTIPLIERS } from './types';
import {
  hexToHsl,
  hslToHex,
  lerpColor,
  adjustLightness,
  adjustSaturation,
  withAlpha,
} from './color-utils';
import { adjustForContrast } from './contrast';
import parameterMap from './parameter-map.json';

/** Minimum lightness spread between surface_base and surface_highlight (dark themes only) */
const MIN_HIGHLIGHT_SPREAD_DARK = 12;

/** Minimum lightness for control_bg to ensure visibility */
const MIN_CONTROL_BG_LIGHTNESS = 5;

/**
 * Resolve partial semantic roles into a complete set.
 * Missing optional roles are derived from the required ones.
 * The contrastLevel parameter scales the lightness offsets between surface colors.
 */
export function resolveRoles(input: SemanticColorRoles): ResolvedColorRoles {
  const isDark = input.tone === 'dark';
  const baseHsl = hexToHsl(input.surface_base);

  // Get contrast multiplier (default to 'medium')
  const contrastLevel: ContrastLevel = input.contrastLevel ?? 'medium';
  const cm = CONTRAST_MULTIPLIERS[contrastLevel];

  // Base offsets (these are the "low" contrast values - original behavior)
  const highlightOffset = isDark ? 6 : 9;
  const borderOffset = isDark ? 4 : 5;
  const controlOffset = isDark ? 9 : 16;

  // surface_highlight: slightly lighter than surface_base for both dark and light themes
  // Enforce minimum spread for dark themes to ensure UI element visibility
  let highlightL = baseHsl.l + highlightOffset * cm;

  if (isDark) {
    const spread = highlightL - baseHsl.l;
    if (spread < MIN_HIGHLIGHT_SPREAD_DARK) {
      highlightL = baseHsl.l + MIN_HIGHLIGHT_SPREAD_DARK;
    }
    // Clamp dark themes to 95% max
    highlightL = Math.min(highlightL, 95);
  } else {
    // Light themes: let highlights go toward white (no aggressive clamping)
    // Only clamp to 100% (valid lightness range)
    highlightL = Math.min(highlightL, 100);
  }

  const surface_highlight = input.surface_highlight
    ?? hslToHex(baseHsl.h, baseHsl.s, highlightL);

  // surface_border: slightly darker (dark) or darker (light) than surface_base
  const surface_border = input.surface_border
    ?? hslToHex(baseHsl.h, baseHsl.s, baseHsl.l - borderOffset * cm);

  // detail_bg: between surface_base and surface_highlight
  const detail_bg = input.detail_bg
    ?? lerpColor(input.surface_base, surface_highlight, 0.5);

  // control_bg: much darker (dark) or much lighter (light) than surface_base
  // Enforce minimum lightness to ensure visibility
  let controlL = isDark
    ? baseHsl.l - controlOffset * cm
    : baseHsl.l + controlOffset * cm;

  if (isDark && controlL < MIN_CONTROL_BG_LIGHTNESS) {
    controlL = MIN_CONTROL_BG_LIGHTNESS;
  }
  // For light themes, clamp to not exceed 95%
  if (!isDark && controlL > 95) {
    controlL = 95;
  }

  const control_bg = input.control_bg
    ?? hslToHex(baseHsl.h, baseHsl.s, controlL);

  // text_secondary: midpoint between text_primary and surface_base
  const text_secondary = input.text_secondary
    ?? lerpColor(input.surface_base, input.text_primary, 0.5);

  // selection_bg: derive from accent_secondary — high lightness, reduced saturation
  const accentHsl = hexToHsl(input.accent_secondary);
  const selection_bg = input.selection_bg
    ?? hslToHex(accentHsl.h, Math.min(accentHsl.s, 40), isDark ? 78 : 88);

  // selection_fg: near-black for readability on the bright selection_bg
  const selection_fg = input.selection_fg
    ?? (isDark ? '#070707' : '#121212');

  const result: ResolvedColorRoles = {
    tone: input.tone,
    surface_base: input.surface_base,
    surface_highlight,
    surface_border,
    detail_bg,
    control_bg,
    text_primary: input.text_primary,
    text_secondary,
    accent_primary: input.accent_primary,
    accent_secondary: input.accent_secondary,
    selection_bg,
    selection_fg,
  };

  // Include optional extended roles if provided
  if (input.surface_secondary) {
    result.surface_secondary = input.surface_secondary;
  }
  if (input.accent_tertiary) {
    result.accent_tertiary = input.accent_tertiary;
  }

  return result;
}

/**
 * Build the 13-stop neutral lightness ramp from resolved roles.
 * Preserves hue and saturation from the surface colors; interpolates lightness.
 */
export function buildNeutralScale(roles: ResolvedColorRoles): NeutralScale {
  const isDark = roles.tone === 'dark';
  const controlHsl = hexToHsl(roles.control_bg);
  const surfaceHsl = hexToHsl(roles.surface_base);
  const highlightHsl = hexToHsl(roles.surface_highlight);
  const textHsl = hexToHsl(roles.text_primary);
  const secondaryHsl = hexToHsl(roles.text_secondary);

  // Use surface hue as the tint for the neutral scale.
  // Saturation ramp: deep stops (n0–n2) get more saturation for visible tinting,
  // mid stops (n9–n9b) get less, and high-mid stops (n11–n11b) are near-neutral.
  const h = surfaceHsl.h;
  const sDeep = Math.min(surfaceHsl.s * 1.4, 70); // n0–n2: panel backs — colorful
  const sSurf = surfaceHsl.s;                      // n3–n8: surface zone — as-is
  const sMid  = surfaceHsl.s * 0.45;               // n9–n9b: scrollbars, rulers
  const sHigh = surfaceHsl.s * 0.20;               // n11–n11b: secondary text — near neutral

  if (isDark) {
    // Calibrated against Default Dark Neutral Medium:
    // n0=#070707(L~2.7), n1=#111111(L~6.7), n2=#181818(L~9.4),
    // n3=#1e1e1e(L~11.8), n4=#242424(L~14.1), n5=#2a2a2a(L~16.5),
    // n6=#363636(L~21.2), n7=#3e3e3e(L~24.3), n8=#464646(L~27.5),
    // n9=#5d5d5d(L~36.5), n9b=#696969(L~41.2), n10=#757575(L~45.9),
    // n11=#868686(L~52.5), n11b=#919191(L~56.9), n12=#b5b5b5(L~70.9)
    const n9L = highlightHsl.l + (secondaryHsl.l - highlightHsl.l) * 0.49;
    return {
      n0_deepest:   hslToHex(h, sDeep, controlHsl.l * 0.23),
      n1_deep:      hslToHex(h, sDeep, controlHsl.l * 0.57),
      n2_dark:      hslToHex(h, sDeep, controlHsl.l * 0.80),
      n3_control:   roles.control_bg,
      n4_area:      hslToHex(h, sSurf, controlHsl.l + (surfaceHsl.l - controlHsl.l) * 0.25),
      n5_border:    roles.surface_border,
      n6_surface:   roles.surface_base,
      n7_detail:    roles.detail_bg,
      n8_highlight: roles.surface_highlight,
      n9_mid_low:   hslToHex(h, sMid, n9L),
      n9b_mid:      hslToHex(h, sMid, n9L + (secondaryHsl.l - n9L) * 0.5),
      n10_mid:      roles.text_secondary,
      n11_mid_high: hslToHex(h, sHigh, secondaryHsl.l + (textHsl.l - secondaryHsl.l) * 0.26),
      n11b_ruler:   hslToHex(h, sHigh, secondaryHsl.l + (textHsl.l - secondaryHsl.l) * 0.44),
      n12_text:     roles.text_primary,
    };
  } else {
    // Light theme: the "lightness" direction is inverted.
    // Calibrated against Default Light Neutral Medium:
    // n0=#070707(L~2.7), n1=#242424(L~14.1), n2=#3d3d3d(L~23.9),
    // n3=#cfcfcf(L~81.2), n4=#6e6e6e(L~43.1), n5=#818181(L~50.6),
    // n6=#a5a5a5(L~64.7), n7=#c6c6c6(L~77.6), n8=#bcbcbc(L~73.7),
    // n9=#4f4f4f(L~31.0), n9b=#5b5b5b(L~35.7), n10=#6e6e6e(L~43.1),
    // n11=#a5a5a5(L~64.7), n11b=#cfcfcf(L~81.2), n12=#121212(L~7.1)
    const n9L = secondaryHsl.l - (secondaryHsl.l - textHsl.l) * 0.34;
    return {
      n0_deepest:   hslToHex(h, sDeep, textHsl.l * 0.38),
      n1_deep:      hslToHex(h, sDeep, textHsl.l + (secondaryHsl.l - textHsl.l) * 0.20),
      n2_dark:      hslToHex(h, sDeep, textHsl.l + (secondaryHsl.l - textHsl.l) * 0.47),
      n3_control:   roles.control_bg,
      n4_area:      hslToHex(h, sSurf, secondaryHsl.l),
      n5_border:    roles.surface_border,
      n6_surface:   roles.surface_base,
      n7_detail:    roles.detail_bg,
      n8_highlight: roles.surface_highlight,
      n9_mid_low:   hslToHex(h, sMid, n9L),
      n9b_mid:      hslToHex(h, sMid, n9L + (secondaryHsl.l - n9L) * 0.38),
      n10_mid:      roles.text_secondary,
      n11_mid_high: hslToHex(h, sHigh, surfaceHsl.l),
      n11b_ruler:   hslToHex(h, sHigh, controlHsl.l),
      n12_text:     roles.text_primary,
    };
  }
}

/** Get blend factors for the given tone */
export function getBlendFactors(tone: 'light' | 'dark'): BlendFactors {
  const factors = parameterMap.blendFactors[tone];
  return {
    defaultBlendFactor: factors.DefaultBlendFactor,
    iconBlendFactor: factors.IconBlendFactor,
    clipBlendFactor: factors.ClipBlendFactor,
    noteBorderStandbyBlendFactor: factors.NoteBorderStandbyBlendFactor,
    retroDisplayBlendFactor: factors.RetroDisplayBlendFactor,
    checkControlNotCheckedBlendFactor: factors.CheckControlNotCheckedBlendFactor,
    mixSurfaceAreaBlendFactor: factors.MixSurfaceAreaBlendFactor,
    textFrameSegmentBlendFactor: factors.TextFrameSegmentBlendFactor,
    noteDisabledSelectedBlendFactor: factors.NoteDisabledSelectedBlendFactor,
    minVelocityNoteBlendFactor: factors.MinVelocityNoteBlendFactor,
    stripedBackgroundShadeFactor: factors.StripedBackgroundShadeFactor,
    nonEditableAutomationAlpha: factors.NonEditableAutomationAlpha,
    disabledContextMenuIconAlpha: factors.DisabledContextMenuIconAlpha,
    clipBorderAlpha: factors.ClipBorderAlpha,
    scrollBarAlpha: factors.ScrollBarAlpha,
    scrollBarOnHoverAlpha: factors.ScrollBarOnHoverAlpha,
    scrollBarBackgroundAlpha: factors.ScrollBarBackgroundAlpha,
    inaudibleTakeLightness: factors.InaudibleTakeLightness,
    inaudibleTakeSaturation: factors.InaudibleTakeSaturation,
    inaudibleTakeNameLightness: factors.InaudibleTakeNameLightness,
    inaudibleTakeNameSaturation: factors.InaudibleTakeNameSaturation,
    automationLaneClipBodyLightness: factors.AutomationLaneClipBodyLightness,
    automationLaneClipBodySaturation: factors.AutomationLaneClipBodySaturation,
    automationLaneHeaderLightness: factors.AutomationLaneHeaderLightness,
    automationLaneHeaderSaturation: factors.AutomationLaneHeaderSaturation,
    takeLaneHeaderLightness: factors.TakeLaneHeaderLightness,
    takeLaneHeaderSaturation: factors.TakeLaneHeaderSaturation,
    takeLaneHeaderNameLightness: factors.TakeLaneHeaderNameLightness,
    takeLaneHeaderNameSaturation: factors.TakeLaneHeaderNameSaturation,
    automationLaneHeaderNameLightness: factors.AutomationLaneHeaderNameLightness,
    automationLaneHeaderNameSaturation: factors.AutomationLaneHeaderNameSaturation,
    clipContrastColorAdjustment: factors.ClipContrastColorAdjustment,
    sessionSlotOklabLCompensationFactor: factors.SessionSlotOklabLCompensationFactor,
  };
}

/** Get VU meter definitions (identical across all themes) */
export function getVuMeters(): Record<string, VuMeterGradient> {
  const meters: Record<string, VuMeterGradient> = {};
  for (const [name, data] of Object.entries(parameterMap.vuMeters)) {
    if (name === '_comment') continue;
    const m = data as {
      onlyMinimumToMaximum: boolean;
      maximum: string;
      aboveZeroDecibel: string;
      zeroDecibel: string;
      belowZeroDecibel1: string;
      belowZeroDecibel2: string;
      minimum: string;
    };
    meters[name] = {
      onlyMinimumToMaximum: m.onlyMinimumToMaximum,
      maximum: m.maximum,
      aboveZeroDecibel: m.aboveZeroDecibel,
      zeroDecibel: m.zeroDecibel,
      belowZeroDecibel1: m.belowZeroDecibel1,
      belowZeroDecibel2: m.belowZeroDecibel2,
      minimum: m.minimum,
    };
  }
  return meters;
}

/**
 * Resolve a single parameter value from its mapping entry.
 */
function resolveParameter(
  paramName: string,
  entry: Record<string, unknown>,
  roles: ResolvedColorRoles,
  scale: NeutralScale,
): string | null {
  const isDark = roles.tone === 'dark';
  const type = entry.type as string;

  const roleMap: Record<string, string> = {
    surface_base: roles.surface_base,
    surface_highlight: roles.surface_highlight,
    surface_border: roles.surface_border,
    detail_bg: roles.detail_bg,
    control_bg: roles.control_bg,
    text_primary: roles.text_primary,
    text_secondary: roles.text_secondary,
    accent_primary: roles.accent_primary,
    accent_secondary: roles.accent_secondary,
    selection_bg: roles.selection_bg,
    selection_fg: roles.selection_fg,
    // Optional extended roles (fall back to existing roles if not set)
    surface_secondary: roles.surface_secondary ?? roles.surface_highlight,
    accent_tertiary: roles.accent_tertiary ?? roles.accent_secondary,
  };

  const scaleMap: Record<string, string> = {
    n0_deepest: scale.n0_deepest,
    n1_deep: scale.n1_deep,
    n2_dark: scale.n2_dark,
    n3_control: scale.n3_control,
    n4_area: scale.n4_area,
    n5_border: scale.n5_border,
    n6_surface: scale.n6_surface,
    n7_detail: scale.n7_detail,
    n8_highlight: scale.n8_highlight,
    n9_mid_low: scale.n9_mid_low,
    n9b_mid: scale.n9b_mid,
    n10_mid: scale.n10_mid,
    n11_mid_high: scale.n11_mid_high,
    n11b_ruler: scale.n11b_ruler,
    n12_text: scale.n12_text,
  };

  const lookupColor = (key: string): string => {
    return roleMap[key] ?? scaleMap[key] ?? key;
  };

  switch (type) {
    case 'role':
      return lookupColor(entry.source as string);

    case 'scale':
      return lookupColor(entry.source as string);

    case 'fixed':
      return entry.value as string;

    case 'tone': {
      const toneKey = isDark ? 'dark' : 'light';
      const source = entry[toneKey] as string | undefined;
      // Handle light_alpha special case
      if (!isDark && entry.light_alpha) {
        const alphaEntry = entry.light_alpha as { source: string; alpha: string };
        return withAlpha(lookupColor(alphaEntry.source), alphaEntry.alpha);
      }
      if (source) return lookupColor(source);
      return null;
    }

    case 'alpha': {
      const color = lookupColor(entry.source as string);
      const alpha = entry.alpha as string;
      return withAlpha(color, alpha);
    }

    case 'semantic': {
      const toneKey = isDark ? 'dark' : 'light';
      return (entry[toneKey] as string) ?? null;
    }

    case 'derived':
      // Handle specific derived rules
      return resolveDerivedParameter(paramName, roles);

    default:
      return null;
  }
}

/**
 * Handle parameters with custom derivation rules.
 */
function resolveDerivedParameter(
  paramName: string,
  roles: ResolvedColorRoles,
): string {
  const isDark = roles.tone === 'dark';

  switch (paramName) {
    case 'StandbySelectionBackground': {
      // Calibrated: #b0ddeb → #637e86 (dark), #cdf8ff → #abc6cb (light)
      // Desaturate and darken significantly
      const color = adjustSaturation(roles.selection_bg, isDark ? -25 : -20);
      return adjustLightness(color, isDark ? -30 : -15);
    }

    case 'SelectionBackgroundContrast': {
      // Midpoint between selection_bg and standby
      const standby = adjustLightness(
        adjustSaturation(roles.selection_bg, isDark ? -25 : -20),
        isDark ? -30 : -15
      );
      return lerpColor(roles.selection_bg, standby, 0.55);
    }

    case 'TakeLaneTrackNotHighlighted':
    case 'WarperTimeBarMarkerBackground': {
      // Calibrated: #363636 → #303030 (dark, -2.2L), #a5a5a5 → #9c9c9c (light, -3.5L)
      return adjustLightness(roles.surface_base, isDark ? -2.2 : -3.5);
    }

    case 'MutedAuditionClip': {
      // Dark=#636363, Light=#9c9c9c — between text_secondary and surface_base
      return lerpColor(roles.surface_base, roles.text_secondary, isDark ? 0.65 : 0.55);
    }

    case 'RangeEditField': {
      // Calibrated: #03c3d5 → #007383 (dark), #00eeff → #00cadb (light)
      // Accent secondary with lightness roughly halved in dark, slight darken in light
      const hsl = hexToHsl(roles.accent_secondary);
      return hslToHex(hsl.h, hsl.s, isDark ? hsl.l * 0.55 : hsl.l * 0.85);
    }

    default:
      // Fallback: return a mid-gray
      return isDark ? '#636363' : '#9c9c9c';
  }
}

/**
 * Generate all 236 color parameters from resolved roles and neutral scale.
 */
export function generateParameters(
  roles: ResolvedColorRoles,
  scale: NeutralScale,
): Record<string, string> {
  const params: Record<string, string> = {};
  const paramEntries = parameterMap.parameters as Record<string, Record<string, unknown>>;

  for (const [paramName, entry] of Object.entries(paramEntries)) {
    const value = resolveParameter(paramName, entry, roles, scale);
    if (value !== null) {
      params[paramName] = value;
    }
  }

  return params;
}

/**
 * Full pipeline: from partial semantic roles to complete theme data.
 */
export function generateTheme(input: SemanticColorRoles): AbletonThemeData {
  const resolved = resolveRoles(input);
  // Auto-adjust foreground colors to meet contrast requirements
  const roles = adjustForContrast(resolved);
  const neutralScale = buildNeutralScale(roles);
  const parameters = generateParameters(roles, neutralScale);
  const vuMeters = getVuMeters();
  const blendFactors = getBlendFactors(roles.tone);

  return {
    roles,
    neutralScale,
    parameters,
    vuMeters,
    blendFactors,
  };
}
