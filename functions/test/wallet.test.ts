import { describe, it, expect } from 'vitest';

/**
 * Pure ledger calculation tests reflecting Greenfield Sec. 4 Lines 283-285.
 * Verifies financial ledger balance arithmetic, integer minor unit precision (Paise),
 * and overdraft protection without requiring live Cloud Firestore emulators.
 */

interface WalletState {
  userId: string;
  balanceMinor: number;
  currency: string;
}

interface LedgerEntry {
  id: string;
  direction: 'credit' | 'debit';
  amountMinor: number;
  type: string;
  idempotencyKey?: string;
}

class InMemLedgerService {
  private wallet: WalletState;
  private entries: Map<string, LedgerEntry> = new Map();

  constructor(userId: string, initialBalanceMinor = 0) {
    this.wallet = {
      userId,
      balanceMinor: initialBalanceMinor,
      currency: 'INR',
    };
  }

  getBalanceMinor(): number {
    return this.wallet.balanceMinor;
  }

  getBalanceRupees(): number {
    return this.wallet.balanceMinor / 100;
  }

  applyCredit(
    amountMinor: number,
    source: { entryId: string; type: string; idempotencyKey?: string }
  ): { balanceMinor: number; balance: number; replayed: boolean } {
    if (amountMinor <= 0 || !Number.isInteger(amountMinor)) {
      throw new Error('Credit amountMinor must be a positive integer');
    }

    if (this.entries.has(source.entryId)) {
      return {
        balanceMinor: this.wallet.balanceMinor,
        balance: this.wallet.balanceMinor / 100,
        replayed: true,
      };
    }

    this.wallet.balanceMinor += amountMinor;
    this.entries.set(source.entryId, {
      id: source.entryId,
      direction: 'credit',
      amountMinor,
      type: source.type,
      idempotencyKey: source.idempotencyKey,
    });

    return {
      balanceMinor: this.wallet.balanceMinor,
      balance: this.wallet.balanceMinor / 100,
      replayed: false,
    };
  }

  applyDebit(
    amountMinor: number,
    details: { entryId: string; type: string; idempotencyKey?: string }
  ): { newBalMinor: number; newBalance: number; replayed: boolean } {
    if (amountMinor <= 0 || !Number.isInteger(amountMinor)) {
      throw new Error('Debit amountMinor must be a positive integer');
    }

    if (this.entries.has(details.entryId)) {
      return {
        newBalMinor: this.wallet.balanceMinor,
        newBalance: this.wallet.balanceMinor / 100,
        replayed: true,
      };
    }

    if (this.wallet.balanceMinor < amountMinor) {
      throw new Error(
        `Insufficient wallet balance. Required: ₹${(amountMinor / 100).toFixed(2)}, available: ₹${(this.wallet.balanceMinor / 100).toFixed(2)}.`
      );
    }

    this.wallet.balanceMinor -= amountMinor;
    this.entries.set(details.entryId, {
      id: details.entryId,
      direction: 'debit',
      amountMinor,
      type: details.type,
      idempotencyKey: details.idempotencyKey,
    });

    return {
      newBalMinor: this.wallet.balanceMinor,
      newBalance: this.wallet.balanceMinor / 100,
      replayed: false,
    };
  }
}

describe('Wallet Ledger Arithmetic & Integrity', () => {
  it('initializes wallet with zero balance', () => {
    const ledger = new InMemLedgerService('user_test_1');
    expect(ledger.getBalanceMinor()).toBe(0);
    expect(ledger.getBalanceRupees()).toBe(0);
  });

  it('correctly credits money in integer minor units (paise)', () => {
    const ledger = new InMemLedgerService('user_test_1');
    
    // Credit ₹500 (50,000 paise)
    const res1 = ledger.applyCredit(50000, { entryId: 'entry_1', type: 'topup' });
    expect(res1.balanceMinor).toBe(50000);
    expect(res1.balance).toBe(500);
    expect(res1.replayed).toBe(false);

    // Credit ₹25.50 (2,550 paise)
    const res2 = ledger.applyCredit(2550, { entryId: 'entry_2', type: 'topup' });
    expect(res2.balanceMinor).toBe(52550);
    expect(res2.balance).toBe(525.5);
    expect(res2.replayed).toBe(false);
  });

  it('correctly debits money for orders', () => {
    const ledger = new InMemLedgerService('user_test_1', 100000); // ₹1000 initial

    // Debit ₹350 (35,000 paise)
    const debitRes = ledger.applyDebit(35000, { entryId: 'entry_order_1', type: 'order_payment' });
    expect(debitRes.newBalMinor).toBe(65000);
    expect(debitRes.newBalance).toBe(650);
    expect(debitRes.replayed).toBe(false);
  });

  it('rejects debit when balance is insufficient (overdraft protection)', () => {
    const ledger = new InMemLedgerService('user_test_1', 1000); // ₹10 available

    // Attempt to debit ₹10.01 (1,001 paise)
    expect(() =>
      ledger.applyDebit(1001, { entryId: 'entry_order_overdraft', type: 'order_payment' })
    ).toThrowError(/Insufficient wallet balance/);

    // Balance should remain unchanged
    expect(ledger.getBalanceMinor()).toBe(1000);
  });

  it('prevents double-crediting on idempotent replay', () => {
    const ledger = new InMemLedgerService('user_test_1');

    const res1 = ledger.applyCredit(10000, { entryId: 'entry_pay_abc', type: 'topup' });
    expect(res1.balanceMinor).toBe(10000);
    expect(res1.replayed).toBe(false);

    // Replay identical payment event
    const res2 = ledger.applyCredit(10000, { entryId: 'entry_pay_abc', type: 'topup' });
    expect(res2.balanceMinor).toBe(10000); // Did not double to 20,000!
    expect(res2.replayed).toBe(true);
  });

  it('prevents double-debiting on idempotent replay', () => {
    const ledger = new InMemLedgerService('user_test_1', 20000);

    const res1 = ledger.applyDebit(5000, { entryId: 'entry_order_xyz', type: 'order_payment' });
    expect(res1.newBalMinor).toBe(15000);
    expect(res1.replayed).toBe(false);

    // Replay identical debit event
    const res2 = ledger.applyDebit(5000, { entryId: 'entry_order_xyz', type: 'order_payment' });
    expect(res2.newBalMinor).toBe(15000); // Did not deduct again to 10,000!
    expect(res2.replayed).toBe(true);
  });

  it('handles exact zero balance deduction without error', () => {
    const ledger = new InMemLedgerService('user_test_1', 5000);
    const res = ledger.applyDebit(5000, { entryId: 'entry_exact', type: 'order_payment' });
    expect(res.newBalMinor).toBe(0);
    expect(res.newBalance).toBe(0);
  });

  it('avoids JavaScript floating point precision issues using integer paise', () => {
    // Standard JS float issue: 0.1 + 0.2 = 0.30000000000000004
    // Integer minor units (Paise): 10 paise + 20 paise = 30 paise exactly
    const ledger = new InMemLedgerService('user_test_1');
    ledger.applyCredit(10, { entryId: 'p1', type: 'topup' });
    ledger.applyCredit(20, { entryId: 'p2', type: 'topup' });
    expect(ledger.getBalanceMinor()).toBe(30);
    expect(ledger.getBalanceRupees()).toBe(0.3);
  });
});
