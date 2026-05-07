// v4 Design Tokens — shared constants for the v4-cinematic visual system
// All values are in frame coordinates for vertical 1080×1920 unless noted

export const COLORS = {
  background: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#8E8E93',
  divider: '#E5E5EA',
  surfaceSubtle: '#F2F2F7',
  destructive: '#FF3B30',
  brandStart: '#FB923C',
  brandMid: '#FB7185',
  brandEnd: '#F472B6',
  shadowTint: 'rgba(251, 113, 133, 0.10)',
} as const;

export const TYPOGRAPHY = {
  hero: { size: 96, weight: 700 },
  largeHeading: { size: 64, weight: 600 },
  sectionLabel: { size: 56, weight: 600 },
  menuItem: { size: 44, weight: 500 },
  chatMessage: { size: 36, weight: 400 },
  emphasis: { size: 32, weight: 600 },
  metadata: { size: 26, weight: 400 },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

export const SHADOWS = {
  phone: '0 30px 80px rgba(251, 113, 133, 0.15)',
  modal: '0 -20px 60px rgba(251, 113, 133, 0.12)',
  floating: '0 8px 24px rgba(251, 113, 133, 0.08)',
} as const;

export const BRAND_GRADIENT = `linear-gradient(135deg, ${COLORS.brandStart} 0%, ${COLORS.brandMid} 50%, ${COLORS.brandEnd} 100%)`;
