import { StyleSheet } from 'react-native';

export type Scheme = 'light' | 'dark';

let currentCategoryScheme: Scheme = 'light';

export function getCategoryScheme(): Scheme {
  return currentCategoryScheme;
}

export function setCategoryScheme(scheme: Scheme) {
  currentCategoryScheme = scheme;
}

export function isCategoryDark(): boolean {
  return currentCategoryScheme === 'dark';
}

// ── Background Color Mappings ────────────────────────────────────────────────
const lightToDarkBg: Record<string, string> = {
  '#ffffff': '#1D1E22',
  '#fff': '#1D1E22',
  '#f8fafc': '#121214',
  '#f4f7ee': '#121214',
  '#f3f4f6': '#121214',
  '#f1f5f9': '#1E2024',
  '#f9fafb': '#24262B',
  '#f9fbf5': '#24262B',
  '#fafcf8': '#1D1E22',
  '#fafafa': '#18181B',
  '#f4f4f5': '#1E2024',
  '#edf4e3': 'rgba(95, 163, 0, 0.2)',
  '#eff8e6': 'rgba(98, 186, 0, 0.15)',
  '#f0fdf4': 'rgba(34, 197, 94, 0.15)',
  '#ecfdf5': 'rgba(16, 185, 129, 0.15)',
  '#f0fdfa': 'rgba(20, 184, 166, 0.15)',
  '#fffbe8': 'rgba(245, 158, 11, 0.15)',
  '#fffbeb': 'rgba(245, 158, 11, 0.15)',
  '#fff3e0': 'rgba(255, 152, 0, 0.2)',
  '#ffebee': 'rgba(239, 68, 68, 0.2)',
  '#fef2f2': 'rgba(239, 68, 68, 0.15)',
  '#f7fee7': 'rgba(101, 163, 13, 0.15)',
  '#e2e8f0': 'rgba(255, 255, 255, 0.08)',
  '#e5e7eb': 'rgba(255, 255, 255, 0.08)',
  '#e4e4e7': 'rgba(255, 255, 255, 0.08)',
  'rgba(255, 255, 255, 0.95)': 'rgba(18, 18, 20, 0.95)',
  'rgba(255, 255, 255, 0.96)': 'rgba(29, 30, 34, 0.96)',
  'rgba(255, 255, 255, 0.9)': 'rgba(29, 30, 34, 0.9)',
  'rgba(255, 255, 255, 0.85)': 'rgba(29, 30, 34, 0.85)',
  'rgba(0, 0, 0, 0.02)': 'rgba(255, 255, 255, 0.04)',
  'rgba(0, 0, 0, 0.03)': 'rgba(255, 255, 255, 0.06)',
  'rgba(0, 0, 0, 0.04)': 'rgba(255, 255, 255, 0.07)',
  'rgba(0, 0, 0, 0.05)': 'rgba(255, 255, 255, 0.08)',
  'rgba(0, 0, 0, 0.06)': 'rgba(255, 255, 255, 0.09)',
  'rgba(0, 0, 0, 0.08)': 'rgba(255, 255, 255, 0.1)',
  'rgba(30, 23, 44, 0.85)': 'rgba(29, 30, 34, 0.85)',
  'rgba(0, 0, 0, 0.35)': 'rgba(0, 0, 0, 0.65)',
  '#171124': '#1D1E22',
  '#1f1733': '#1D1E22',
  '#120d1d': '#121214',
  'rgba(23, 17, 36, 0.95)': '#1D1E22',
  'rgba(23, 17, 36, 0.9)': 'rgba(29, 30, 34, 0.9)',
};

const darkToLightBg: Record<string, string> = {
  '#121214': '#F4F7EE',
  '#1d1e22': '#FFFFFF',
  '#24262b': '#F9FAFB',
  '#1e2024': '#F1F5F9',
  '#18181b': '#FAFAFA',
  'rgba(95, 163, 0, 0.2)': '#EDF4E3',
  'rgba(255, 152, 0, 0.2)': '#FFF3E0',
  'rgba(239, 68, 68, 0.2)': '#FFEBEE',
  'rgba(18, 18, 20, 0.95)': 'rgba(255, 255, 255, 0.95)',
  'rgba(29, 30, 34, 0.96)': 'rgba(255, 255, 255, 0.96)',
  'rgba(29, 30, 34, 0.9)': 'rgba(255, 255, 255, 0.9)',
  'rgba(29, 30, 34, 0.85)': 'rgba(30, 23, 44, 0.85)',
  '#171124': '#FFFFFF',
  '#1f1733': '#FFFFFF',
  '#120d1d': '#FFFFFF',
  'rgba(23, 17, 36, 0.95)': '#FFFFFF',
  'rgba(23, 17, 36, 0.9)': 'rgba(0, 0, 0, 0.4)',
};

// ── Text Color Mappings ──────────────────────────────────────────────────────
const lightToDarkText: Record<string, string> = {
  '#000000': '#F8FAFC',
  '#000': '#F8FAFC',
  '#0a0710': '#F8FAFC',
  '#0f172a': '#F8FAFC',
  '#101828': '#F8FAFC',
  '#111111': '#F8FAFC',
  '#111812': '#F8FAFC',
  '#111827': '#F8FAFC',
  '#171717': '#F8FAFC',
  '#18181b': '#F8FAFC',
  '#1a1a1a': '#F1F1EC',
  '#1e232a': '#F1F1EC',
  '#1e293b': '#F1F5F9',
  '#1f2937': '#F1F1EC',
  '#222222': '#F1F1EC',
  '#222': '#F1F1EC',
  '#23272f': '#F1F1EC',
  '#27272a': '#F1F1EC',
  '#2c3a2f': '#F1F5F9',
  '#2d3748': '#E2E8F0',
  '#333333': '#E2E8F0',
  '#333': '#E2E8F0',
  '#334155': '#E2E8F0',
  '#344054': '#E2E8F0',
  '#374151': '#D1D5DB',
  '#3f3f46': '#D4D4D8',
  '#444444': '#CBD5E1',
  '#444': '#CBD5E1',
  '#475467': '#CBD5E1',
  '#475569': '#CBD5E1',
  '#4a5568': '#CBD5E1',
  '#4b5563': '#CBD5E1',
  '#52525b': '#A1A1AA',
  '#555555': '#CBD5E1',
  '#555': '#CBD5E1',
  '#55755a': '#A3E635',
  '#5a6370': '#9BA08F',
  '#64748b': '#94A3B8',
  '#666666': '#94A3B8',
  '#666': '#94A3B8',
  '#667085': '#94A3B8',
  '#6b7280': '#9BA08F',
  '#71717a': '#A1A1AA',
  '#718096': '#A0AEC0',
  '#777777': '#94A3B8',
  '#777': '#94A3B8',
  '#888888': '#94A3B8',
  '#888': '#94A3B8',
  '#8a5c0a': '#FACC15',
  '#8a6423': '#FDE047',
  '#6e4a0f': '#FDE047',
  '#b9832a': '#FDE047',
  '#8e9aab': '#9BA08F',
  '#94a3b8': '#94A3B8',
  '#999999': '#94A3B8',
  '#999': '#94A3B8',
  '#9ca3af': '#9BA08F',
};

const darkToLightText: Record<string, string> = {
  '#f8fafc': '#0F172A',
  '#f1f5f9': '#1E293B',
  '#f1f1ec': '#1A1A1A',
  '#e2e8f0': '#334155',
  '#cbd5e1': '#475569',
  '#94a3b8': '#64748B',
  '#9ba08f': '#6B7280',
  '#6b7266': '#8E9AAB',
  '#d1d5db': '#374151',
  '#d4d4d8': '#3F3F46',
  '#a1a1aa': '#52525B',
  '#a0aec0': '#718096',
  '#a3e635': '#55755A',
  '#fde047': '#8A6423',
  '#facc15': '#8A5C0A',
};

// ── Border Color Mappings ────────────────────────────────────────────────────
const lightToDarkBorder: Record<string, string> = {
  '#e0e6d6': 'rgba(255, 255, 255, 0.08)',
  '#ebf0e2': 'rgba(255, 255, 255, 0.06)',
  '#e5e7eb': 'rgba(255, 255, 255, 0.08)',
  '#e2e8f0': 'rgba(255, 255, 255, 0.12)',
  '#cbd5e1': 'rgba(255, 255, 255, 0.18)',
  '#d1d5db': 'rgba(255, 255, 255, 0.12)',
  '#d5ebd1': 'rgba(255, 255, 255, 0.15)',
  '#f3f4f6': 'rgba(255, 255, 255, 0.08)',
  '#f1f5f9': 'rgba(255, 255, 255, 0.08)',
  '#e4e4e7': 'rgba(255, 255, 255, 0.08)',
  '#94a3b8': 'rgba(255, 255, 255, 0.2)',
  '#86efac': 'rgba(34, 197, 94, 0.3)',
  '#fde68a': 'rgba(245, 158, 11, 0.3)',
  '#fca5a5': 'rgba(239, 68, 68, 0.3)',
  'rgba(0, 0, 0, 0.05)': 'rgba(255, 255, 255, 0.08)',
  'rgba(0, 0, 0, 0.08)': 'rgba(255, 255, 255, 0.1)',
  'rgba(0, 0, 0, 0.1)': 'rgba(255, 255, 255, 0.1)',
  'rgba(237, 234, 246, 0.12)': 'rgba(255, 255, 255, 0.08)',
};

const darkToLightBorder: Record<string, string> = {
  'rgba(255, 255, 255, 0.08)': '#E5E7EB',
  'rgba(255, 255, 255, 0.06)': '#EBF0E2',
  'rgba(255, 255, 255, 0.12)': '#D1D5DB',
  'rgba(255, 255, 255, 0.18)': '#CBD5E1',
  'rgba(255, 255, 255, 0.1)': 'rgba(0, 0, 0, 0.08)',
  'rgba(255, 255, 255, 0.15)': '#E5E7EB',
  'rgba(255, 255, 255, 0.2)': '#E5E7EB',
};

function transformRule(rule: any, scheme: 'light' | 'dark'): any {
  if (!rule || typeof rule !== 'object') return rule;
  const out = { ...rule };

  for (const prop in out) {
    const val = out[prop];
    if (typeof val !== 'string') continue;
    const lower = val.toLowerCase().trim();

    if (scheme === 'dark') {
      if (prop === 'backgroundColor') {
        if (lightToDarkBg[lower] || lightToDarkBg[val]) {
          out[prop] = lightToDarkBg[lower] || lightToDarkBg[val];
        }
      } else if (prop === 'color') {
        if (lightToDarkText[lower]) {
          out[prop] = lightToDarkText[lower];
        }
      } else if (prop.toLowerCase().includes('border') && prop.toLowerCase().includes('color')) {
        if (lightToDarkBorder[lower] || lightToDarkBorder[val]) {
          out[prop] = lightToDarkBorder[lower] || lightToDarkBorder[val];
        }
      }
    } else {
      if (prop === 'backgroundColor') {
        if (darkToLightBg[lower] || darkToLightBg[val]) {
          out[prop] = darkToLightBg[lower] || darkToLightBg[val];
        }
      } else if (prop === 'color') {
        if (darkToLightText[lower]) {
          out[prop] = darkToLightText[lower];
        }
      } else if (prop.toLowerCase().includes('border') && prop.toLowerCase().includes('color')) {
        if (darkToLightBorder[lower] || darkToLightBorder[val]) {
          out[prop] = darkToLightBorder[lower] || darkToLightBorder[val];
        }
      }
    }
  }

  return out;
}

// ── Monkey-Patch StyleSheet.create ──────────────────────────────────────────
const originalCreate = StyleSheet.create;
let isInstalled = false;

export function installCategoryTheme() {
  if (isInstalled) return;
  isInstalled = true;

  (StyleSheet as any).create = function <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
    styles: T | StyleSheet.NamedStyles<T>
  ): T {
    if (!styles || typeof styles !== 'object') {
      return originalCreate.call(this, styles) as any;
    }

    const created = originalCreate.call(this, styles);
    const cache = new Map<string, any>();

    return new Proxy(created, {
      get(target, prop) {
        if (typeof prop !== 'string' || !(prop in target)) {
          return (target as any)[prop];
        }

        // Logo badges and plates must remain white even in dark theme
        const lowerProp = prop.toLowerCase();
        if (
          lowerProp.includes('logobadge') ||
          lowerProp.includes('iconcircle') ||
          lowerProp.includes('logocircle') ||
          lowerProp.includes('brandlogo') ||
          lowerProp === 'plate' ||
          lowerProp.includes('brandmark')
        ) {
          return (target as any)[prop];
        }

        const scheme = getCategoryScheme();
        const cacheKey = prop + '_' + scheme;
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey);
        }

        const originalRule = (styles as any)[prop] || (target as any)[prop];
        const transformed = transformRule(originalRule, scheme);
        cache.set(cacheKey, transformed);
        return transformed;
      },
    }) as T;
  };
}

// Auto-install immediately on module evaluation
installCategoryTheme();
