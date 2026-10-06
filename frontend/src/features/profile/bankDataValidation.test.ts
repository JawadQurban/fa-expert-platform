import { describe, expect, it } from 'vitest';
import { EMPTY_BANK_DATA, invalidBankDataFields, validateBankData } from './profile.types';
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
