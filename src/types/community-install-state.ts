export interface InstalledCommunityTheme {
  themeId: string;      // Supabase UUID
  filePath: string;     // Local .ask file path
  installedAt: string;  // ISO timestamp
}

export interface CommunityInstallState {
  version: number;
  themes: InstalledCommunityTheme[];
}
