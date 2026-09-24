import { StyleSheet } from 'react-native';

import { SECTION_LABEL_COLOR, type OrdersColors } from './theme';

// A factory, not a static stylesheet: colors come from the current app
// theme, so this is rebuilt from the live palette on every render instead
// of being computed once (dark-only) at import time.
export function createStyles(COLORS: OrdersColors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.screen,
    borderRadius: 24,
    overflow: 'hidden',
    margin: 12,
    borderWidth: 1,
    borderColor: COLORS.borderScreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: COLORS.text,
    fontSize: 16,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsRow: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.chip,
  },
  tabEmoji: {
    fontSize: 15,
  },
  tabLabel: {
    color: COLORS.textChip,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionLabel: {
    color: SECTION_LABEL_COLOR,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardSub: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: COLORS.borderAction,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: COLORS.textAction,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyMsg: {
    color: COLORS.textFaint,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  });
}
