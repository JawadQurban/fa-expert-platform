import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { expectNoA11yViolations, renderWithProviders } from '../../../test/test-utils';
import { getProfileContent } from '../profile.content';
import type { BankCountryOption, ProfileBankDataDto } from '../profile.types';
import { BankDataSection } from './BankDataSection';

const content = getProfileContent('ar');
const countries: readonly BankCountryOption[] = [
  { labelAr: 'السعودية', labelEn: 'Saudi Arabia', iso: 'SA' },
  { labelAr: 'المملكة المتحدة', labelEn: 'United Kingdom', iso: 'GB' },
];
const requested: ProfileBankDataDto = {
  state: 'requested',
  fields: null,
  requestedAt: '2026-10-01T00:00:00Z',
  completedAt: null,
  // FAST's own spelling, in English — matched to the option, stored in Arabic.
  suggested: {
    bankCountry: 'United Kingdom',
    bankCity: 'London',
    bankName: 'Westminster Bank',
    branchName: 'City',
    swiftCode: 'NWBKGB2L',
    accountHolderName: 'Sara',
    accountNumber: '98765432',
  },
};

function renderSection(onSave = vi.fn()) {
  const view = renderWithProviders(
    <BankDataSection
      bankData={requested}
      content={content}
      locale="ar"
      saving={false}
      onSave={onSave}
      loadCountries={() => Promise.resolve(countries)}
    />
  );
  return { ...view, onSave };
}

describe('BankDataSection — RUN-026', () => {
  it('offers the bank country as a dropdown and checks a GB IBAN against it', async () => {
    const { container, onSave, user } = renderSection();

    const country = await screen.findByRole('combobox', {
      name: new RegExp(content.bankData.fields.bankCountry),
    });
    expect(country).toHaveTextContent('المملكة المتحدة');
    await expectNoA11yViolations(container);

    const iban = screen.getByLabelText(content.bankData.fields.iban, { exact: false });
    // A broken mod-97 checksum is refused…
    fireEvent.change(iban, { target: { value: 'GB83WEST12345698765432' } });
    await user.click(screen.getByRole('button', { name: content.bankData.save }));
    expect(screen.getByText(content.bankData.formatErrors.iban)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    // …a valid British IBAN is not: an IBAN outside SA is no longer rejected.
    fireEvent.change(iban, { target: { value: 'GB82WEST12345698765432' } });
    await user.click(screen.getByRole('button', { name: content.bankData.save }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ bankCountry: 'المملكة المتحدة', iban: 'GB82WEST12345698765432' })
    );
  });
});
