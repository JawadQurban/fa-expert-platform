import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from '@/test/test-utils';
import { useLocale } from './LocaleProvider';

function LocaleProbe() {
  const { t } = useTranslation();
  const { locale, toggleLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="app-name">{t('app.name')}</span>
      <button type="button" onClick={toggleLocale}>
        toggle
      </button>
    </div>
  );
}

describe('LocaleProvider', () => {
  it('starts in Arabic and exposes Arabic copy', () => {
    renderWithProviders(<LocaleProbe />);
    expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    expect(screen.getByTestId('app-name')).toHaveTextContent('الأكاديمية المالية');
  });

  it('toggles AR⇄EN and flips document direction with no content loss', async () => {
    const { user } = renderWithProviders(<LocaleProbe />);
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Financial Academy');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
