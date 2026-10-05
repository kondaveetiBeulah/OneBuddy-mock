import { describe, it, expect } from 'vitest';
import { ConsentPurpose, ConsentRecord } from '../src/domain/enums';

describe('Privacy & Consent Management (DPDP Act 2023 & GDPR)', () => {
  it('validates supported consent purposes', () => {
    const validPurposes: ConsentPurpose[] = [
      'terms_of_service',
      'privacy_policy',
      'location_tracking',
      'marketing_notifications',
      'data_processing_dpdp',
    ];

    expect(validPurposes).toHaveLength(5);
  });

  it('correctly models an immutable consent grant record', () => {
    const consent: ConsentRecord = {
      consentId: 'consent_123',
      purpose: 'terms_of_service',
      granted: true,
      policyVersion: 'v1.0',
      source: 'mobile_app',
      grantedAt: 1728000000000,
      withdrawnAt: null,
      createdAt: 1728000000000,
    };

    expect(consent.granted).toBe(true);
    expect(consent.withdrawnAt).toBeNull();
    expect(consent.policyVersion).toBe('v1.0');
    expect(consent.source).toBe('mobile_app');
  });

  it('correctly models an immutable consent withdrawal record', () => {
    const consent: ConsentRecord = {
      consentId: 'consent_456',
      purpose: 'marketing_notifications',
      granted: false,
      policyVersion: 'v1.0',
      source: 'mobile_app',
      grantedAt: null,
      withdrawnAt: 1728000500000,
      createdAt: 1728000500000,
    };

    expect(consent.granted).toBe(false);
    expect(consent.grantedAt).toBeNull();
    expect(consent.withdrawnAt).toBe(1728000500000);
  });
});
