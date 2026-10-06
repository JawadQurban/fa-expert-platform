import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getExpertHubFooterContent } from '../content/footer.content';

const footer = getExpertHubFooterContent('ar');

/**
 * Expert Hub reuses the **product-neutral shared** `AcademyFooter` composition
 * (`@/shared/footer`) — the same reusable Footer the Hackathon product renders —
 * fed this product's own content. There is no Expert-Hub-specific Footer
 * component (the old `ExpertHubFooter` was removed; `DECISIONS.md` P-15). These
 * tests assert the reuse through the real shell.
 */
describe('Expert Hub footer (reuses the shared AcademyFooter, no duplicate)', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  async function renderShell() {
    const result = renderExpertHubAt(expertHubPaths.landing);
    await screen.findByRole('contentinfo');
    return result;
  }

  it('renders exactly one footer landmark — no duplicate Expert Hub footer', async () => {
    await renderShell();
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('renders Expert Hub footer content (its copyright), never Hackathon wording', async () => {
    await renderShell();
    const contentinfo = screen.getByRole('contentinfo');
    expect(within(contentinfo).getByText(footer.copyright)).toBeInTheDocument();
    expect(within(contentinfo).queryByText(/هاكاثون/)).not.toBeInTheDocument();
  });

  it('feeds the shared composition its own in-namespace platform links', async () => {
    await renderShell();
    const contentinfo = screen.getByRole('contentinfo');
    for (const link of footer.summaryLinks) {
      expect(within(contentinfo).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href
      );
    }
  });

  it('renders the shared footer regions from config: legal nav + social + contact', async () => {
    await renderShell();
    const contentinfo = screen.getByRole('contentinfo');
    // Legal/policy navigation landmark (distinct accessible name).
    expect(
      within(contentinfo).getByRole('navigation', { name: footer.policyLinksLabel })
    ).toBeInTheDocument();
    // Social links render through the shared composition's utilities slot.
    for (const social of footer.socialLinks) {
      expect(within(contentinfo).getByRole('link', { name: social.label })).toHaveAttribute(
        'href',
        social.href
      );
    }
    // An actionable contact item renders as a real link.
    const phone = footer.contactItems.find((c) => c.href != null);
    if (phone?.href != null) {
      expect(within(contentinfo).getByRole('link', { name: phone.value })).toHaveAttribute(
        'href',
        phone.href
      );
    }
  });
});
