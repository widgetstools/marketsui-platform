import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';

export function useThemeColors() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const get = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    return {
      bg: get('--bn-bg') || (isDark ? '#0b0e11' : '#f5f5f5'),
      bg1: get('--bn-bg1') || (isDark ? '#161a1e' : '#ffffff'),
      bg2: get('--bn-bg2') || (isDark ? '#1e2329' : '#f0f1f3'),
      bg3: get('--bn-bg3') || (isDark ? '#2b3139' : '#e6e8eb'),
      border: get('--bn-border') || (isDark ? '#2b3139' : '#e0e3e7'),
      border2: get('--bn-border2') || (isDark ? '#363c45' : '#d1d5db'),
      t0: get('--bn-t0') || (isDark ? '#eaecef' : '#1a1a2e'),
      t1: get('--bn-t1') || (isDark ? '#848e9c' : '#5f6673'),
      t2: get('--bn-t2') || (isDark ? '#5e6673' : '#9ca3af'),
      t3: get('--bn-t3') || (isDark ? '#2e343c' : '#d1d5db'),
      green: get('--bn-green') || '#0ecb81',
      red: get('--bn-red') || '#f6465d',
      yellow: get('--bn-yellow') || (isDark ? '#f0b90b' : '#c99400'),
      blue: get('--bn-blue') || '#1e90ff',
      cyan: get('--bn-cyan') || (isDark ? '#00bcd4' : '#0891b2'),
      gridLine: isDark ? '#1e2329' : '#e6e8eb',
      isDark,
    };
  }, [isDark]);
}
