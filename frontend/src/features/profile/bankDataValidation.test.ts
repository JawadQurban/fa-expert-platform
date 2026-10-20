import { describe, expect, it } from 'vitest';
import {
  EMPTY_BANK_DATA,
  bankCountryIso,
  ibanIsValid,
  invalidBankDataFields,
  validateBankData,
} from './profile.types';
import type { BankDataFields } from './profile.types';

/** J-09 «Bank Data Field Validation Rules» — the same rules the API enforces on save. */
const valid: BankDataFields = {
  bankCountry: 'السعودية',
  bankCity: 'الرياض',
  bankName: 'البنك الأهلي',
  branchName: 'فرع العليا',
  iban: 'SA0380000000608010167519',
  swiftCode: 'NCBKSAJE',
  accountHolderName: 'سارة العتيبي',
  accountNumber: '608010167519',
};

describe('invalidBankDataFields (J-09)', () => {
  it('accepts a Saudi IBAN, an 8- or 11-character SWIFT code and a numeric account number', () => {
    expect(invalidBankDataFields(valid)).toEqual([]);
    expect(invalidBankDataFields({ ...valid, swiftCode: 'NCBKSAJE001' })).toEqual([]);
  });

  it('refuses an IBAN that is not "SA" + 22 digits', () => {
    for (const iban of [
      'SA03800000006080101675',
      'SA038000000060801016751900',
      'AE0380000000608010167519',
      'SA03800000006080101675AB',
    ]) {
      expect(invalidBankDataFields({ ...valid, iban })).toEqual(['iban']);
    }
  });

  it('refuses a SWIFT code of the wrong length or shape', () => {
    for (const swiftCode of ['NCBKSAJ', 'NCBKSAJE0', 'NCBKSAJE0012', '1CBKSAJE', 'NCBK1AJE']) {
      expect(invalidBankDataFields({ ...valid, swiftCode })).toEqual(['swiftCode']);
    }
  });

  it('refuses an account number that is not digits only', () => {
    for (const accountNumber of ['6080-1016', '6080 1016', 'ABC123']) {
      expect(invalidBankDataFields({ ...valid, accountNumber })).toEqual(['accountNumber']);
    }
  });

  it('leaves empty fields to the mandatory-field check', () => {
    expect(invalidBankDataFields(EMPTY_BANK_DATA)).toEqual([]);
    expect(validateBankData(EMPTY_BANK_DATA)).toHaveLength(8);
  });
});

describe('ibanIsValid (RUN-026)', () => {
  it('checks a foreign IBAN by ISO 13616: prefix of the bank country, length and mod-97', () => {
    expect(ibanIsValid('GB82WEST12345698765432', 'GB')).toBe(true);
    expect(ibanIsValid('gb82west12345698765432', 'GB')).toBe(true);
    // One check digit off — the mod-97 checksum fails.
    expect(ibanIsValid('GB83WEST12345698765432', 'GB')).toBe(false);
    // A valid IBAN of another country than the one chosen.
    expect(ibanIsValid('GB82WEST12345698765432', 'DE')).toBe(false);
    // Too short for any country.
    expect(ibanIsValid('GB82WEST123', 'GB')).toBe(false);
    // No ISO code for the country: the IBAN's own prefix picks the rule.
    expect(ibanIsValid('GB82WEST12345698765432', null)).toBe(true);
  });

  it('keeps the Saudi rule for Saudi Arabia', () => {
    expect(ibanIsValid('SA0380000000608010167519', 'SA')).toBe(true);
    expect(ibanIsValid('SA03800000006080101675', 'SA')).toBe(false);
    expect(ibanIsValid('GB82WEST12345698765432', 'SA')).toBe(false);
  });

  it('resolves the chosen country to its ISO code by either name', () => {
    const countries = [
      { labelAr: 'المملكة المتحدة', labelEn: 'United Kingdom', iso: 'GB' },
      { labelAr: 'السعودية', labelEn: 'Saudi Arabia', iso: 'SA' },
    ];
    expect(bankCountryIso('المملكة المتحدة', countries)).toBe('GB');
    expect(bankCountryIso('Saudi Arabia', countries)).toBe('SA');
    expect(bankCountryIso('Atlantis', countries)).toBeNull();
    const british = { ...valid, bankCountry: 'المملكة المتحدة', iban: 'GB82WEST12345698765432' };
    expect(invalidBankDataFields(british, 'GB')).toEqual([]);
  });
});
