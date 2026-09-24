import { Platform, StyleSheet } from 'react-native';
import { useNativeColors } from '../../constants/colors';

// A factory, not a static stylesheet: every color here comes from the
// current app theme, so this has to be rebuilt from the live palette on
// each render instead of being computed once (dark-only) at import time.
export function createStyles(COLORS: ReturnType<typeof useNativeColors>) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    backgroundColor: COLORS.bg,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  headerIconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },

  /* scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  subHeader: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 20,
  },

  sectionLabel: {
    color: COLORS.grayDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowTextWrap: { flex: 1, paddingRight: 12 },
  rowTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowSubtitle: {
    color: COLORS.gray,
    fontSize: 12.5,
    lineHeight: 17,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    color: COLORS.grayDim,
    fontSize: 18,
    marginLeft: 6,
  },

  pillBtn: {
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillBtnText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
  },

  /* toast */
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 34,
    backgroundColor: '#2E2A45',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* bottom sheets */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sheetTitleCenter: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  sheetDesc: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  sheetDescCenter: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  verifyIconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
  },
  verifyIcon: { fontSize: 28 },

  cancelLink: { alignSelf: 'center', marginTop: 14, padding: 6 },
  cancelLinkText: { color: COLORS.grayDim, fontSize: 13, fontWeight: '600' },

  /* tabs */
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabBtnText: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  /* inputs */
  inputLabel: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
  },

  /* buttons */
  yellowBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  yellowBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  yellowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* contacts list */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  contactName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  contactPhone: {
    color: COLORS.gray,
    fontSize: 12.5,
    marginTop: 2,
  },
  emptyText: {
    color: COLORS.grayDim,
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },

  /* family sharing */
  copyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 6,
  },
  copyLinkIcon: { fontSize: 14, marginRight: 6 },
  copyLinkText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  /* download format */
  formatRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 18,
    marginRight: 12,
  },
  formatOptionActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.cardAlt,
  },
  formatIcon: { fontSize: 22, marginBottom: 8, color: COLORS.white },
  formatLabel: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 13,
  },
  formatLabelActive: {
    color: COLORS.accent,
  },
  });
}
