import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Icon } from './Icon';
import { iconRegistry } from './icons';
import { iconCategories } from './icon-categories';

describe('Icon', () => {
  it('renders the named icon from the registry', () => {
    const { container } = renderWithProviders(<Icon name="home-01" decorative />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('is decorative (aria-hidden) by default when no title is given', () => {
    const { container } = renderWithProviders(<Icon name="home-01" />);
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span).not.toHaveAttribute('role');
  });

  it('is functional (role=img + accessible name) when given a title', () => {
    renderWithProviders(<Icon name="home-01" title="الرئيسية" />);
    expect(screen.getByRole('img', { name: 'الرئيسية' })).toBeInTheDocument();
  });

  it('stays decorative even with a title when decorative is explicitly set', () => {
    const { container } = renderWithProviders(<Icon name="home-01" title="الرئيسية" decorative />);
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span).not.toHaveAttribute('role');
  });

  it('reflects size and tone hooks', () => {
    const { container } = renderWithProviders(
      <Icon name="home-01" size="featured" tone="primary" decorative />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('data-size', 'featured');
    expect(span).toHaveAttribute('data-tone', 'primary');
  });

  it('applies the RTL mirror hook only when opted in', () => {
    const { container } = renderWithProviders(<Icon name="home-01" mirrorInRTL decorative />);
    expect(container.querySelector('span')).toHaveAttribute('data-mirror-rtl', 'true');
  });

  // Grouped by category (rather than one flat loop over the whole
  // registry) so a single category can be run in isolation — e.g.
  // `vitest run -t "category: alert"` — without instantiating every other
  // imported category's icons in the same test run. Matters as the
  // registry grows toward its full ~4,372-icon size.
  describe.each(Object.entries(iconCategories))('category: %s', (_categoryId, category) => {
    it('every icon in this category resolves in the registry and renders real SVG markup', () => {
      for (const name of category.icons) {
        const { container, unmount } = renderWithProviders(<Icon name={name} decorative />);
        expect(container.querySelector('svg path')).toBeInTheDocument();
        unmount();
      }
    });
  });

  it('falls back to the placeholder glyph for an unregistered name and warns in dev', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Registry keys are a closed TS union; simulate a value that slipped past
    // narrowing (e.g. from untyped external data) via an intentional cast.
    const unknownName = 'this-icon-does-not-exist' as keyof typeof iconRegistry;
    const { container } = renderWithProviders(<Icon name={unknownName} decorative />);
    expect(container.querySelector('span')).toHaveAttribute('data-missing', 'true');
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('this-icon-does-not-exist'));
  });

  it('has no accessibility violations when functional', async () => {
    const { container } = renderWithProviders(<Icon name="home-01" title="الرئيسية" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when decorative', async () => {
    const { container } = renderWithProviders(<Icon name="home-01" decorative />);
    await expectNoA11yViolations(container);
  });
});

describe('icon-categories metadata', () => {
  it('every category id is kebab-case and matches its icons entry', () => {
    for (const [id, category] of Object.entries(iconCategories)) {
      expect(category.id).toBe(id);
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(category.icons.length).toBeGreaterThan(0);
    }
  });

  it('every icon listed in a category resolves in the registry', () => {
    for (const category of Object.values(iconCategories)) {
      for (const name of category.icons) {
        expect(iconRegistry[name]).toBeDefined();
      }
    }
  });

  it('the known pilot categories are present with their expected counts', () => {
    expect(iconCategories['git'].icons).toHaveLength(10);
    expect(iconCategories['shapes'].icons).toHaveLength(15);
    expect(iconCategories['home'].icons).toHaveLength(15);
    expect(iconCategories['community-icons'].icons).toHaveLength(9);
  });
});

describe('duplicate-name handling (registry-key collision policy)', () => {
  // Mirrors `resolveRegistryName` in scripts/import-icons.mjs — that file is
  // a plain Node script outside the tsc project (tsconfig.app.json only
  // includes `src`), so its exact behavior is re-asserted here as a
  // documented contract rather than imported across the boundary.
  function resolveRegistryName(
    nameOccurrences: Map<string, { category: string }[]>,
    iconKebab: string,
    categoryKebab: string
  ) {
    const occurrences = nameOccurrences.get(iconKebab) ?? [];
    occurrences.push({ category: categoryKebab });
    nameOccurrences.set(iconKebab, occurrences);
    const isDuplicate = occurrences.length > 1;
    return {
      registryName: isDuplicate ? `${iconKebab}__${categoryKebab}` : iconKebab,
      isDuplicate,
    };
  }

  it('keeps the first occurrence under the bare name', () => {
    const seen = new Map<string, { category: string }[]>();
    const result = resolveRegistryName(seen, 'star', 'award');
    expect(result).toEqual({ registryName: 'star', isDuplicate: false });
  });

  it('disambiguates a later occurrence with a category suffix instead of overwriting', () => {
    const seen = new Map<string, { category: string }[]>();
    resolveRegistryName(seen, 'star', 'award');
    const second = resolveRegistryName(seen, 'star', 'emojis');
    expect(second).toEqual({ registryName: 'star__emojis', isDuplicate: true });
  });

  it('the live registry currently has zero collisions (no `__`-suffixed keys)', () => {
    const disambiguated = Object.keys(iconRegistry).filter((name) => name.includes('__'));
    expect(disambiguated).toEqual([]);
  });
});
