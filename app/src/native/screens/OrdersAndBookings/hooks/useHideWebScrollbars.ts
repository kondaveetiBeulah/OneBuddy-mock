import { useEffect } from 'react';
import { Platform } from 'react-native';

// showsHorizontalScrollIndicator / showsVerticalScrollIndicator cover iOS and
// Android. React Native Web ignores them and paints the browser's own
// scrollbars, so on web the rules below hide them instead.

const WEB_SCROLLBAR_CSS = `
.ob-no-scrollbar::-webkit-scrollbar { display: none; }
.ob-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const STYLE_TAG_ID = 'ob-no-scrollbar-style';

export function useHideWebScrollbars(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    if (document.getElementById(STYLE_TAG_ID)) {
      return;
    }
    const tag = document.createElement('style');
    tag.id = STYLE_TAG_ID;
    tag.textContent = WEB_SCROLLBAR_CSS;
    document.head.appendChild(tag);
  }, []);
}

// Spread onto a ScrollView. Null on native, so nothing extra is passed there.
export const webNoScrollbar =
  Platform.OS === 'web' ? ({ className: 'ob-no-scrollbar' } as object) : null;
