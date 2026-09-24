export interface PhoneContact {
  id: string;
  name: string;
  phone: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export type ContactTab = 'manual' | 'contacts';
export type ExportFormat = 'PDF' | 'JSON';

/** The slice of state OneBuddy hands in and gets back out. */
export interface SecurityPrivacyValues {
  biometric: boolean;
  verifiedProfile: boolean;
  familySharing: boolean;
  emergencyContact: string;
}

export interface SecurityPrivacyScreenProps {
  navigation?: {
    goBack?: () => void;
  };
  /**
   * Optional starting values. OneBuddy passes what the WebView document is
   * already holding so the screen opens in sync with the rest of the app
   * instead of showing its own defaults.
   */
  initialValues?: Partial<SecurityPrivacyValues>;
  /** Fired whenever one of the values above changes, so the host can persist it. */
  onValuesChange?: (values: SecurityPrivacyValues) => void;
}
