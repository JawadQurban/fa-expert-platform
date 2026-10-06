import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import { iconCategories } from './icon-categories';
import { iconRegistry } from './icons';
import type { IconName } from './Icon.types';

const meta = {
  title: 'Primitives/Icon',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          'Renders a named icon from the official Platforms Code icon library — see `docs/ICON_LIBRARY.md` for source, coverage, and the re-sync workflow (`scripts/import-icons.mjs`). This story file intentionally never renders the full registry at once (it will eventually hold thousands of icons) — see "Category preview" and "Searchable gallery" for bounded ways to browse it.',
      },
    },
  },
  args: { name: 'home-01' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'featured'] },
    tone: {
      control: 'inline-radio',
      options: ['inherit', 'neutral', 'primary', 'success', 'error', 'warning', 'information'],
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Icon name="home-01" size="sm" title="حجم صغير" />
      <Icon name="home-01" size="md" title="حجم متوسط" />
      <Icon name="home-01" size="featured" title="حجم مميز" />
    </div>
  ),
};

export const Colors: Story = {
  name: 'Colors (tone)',
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <Icon name="give-star" tone="inherit" title="اللون الافتراضي" />
      <Icon name="give-star" tone="neutral" title="محايد" />
      <Icon name="give-star" tone="primary" title="أساسي" />
      <Icon name="give-star" tone="success" title="نجاح" />
      <Icon name="give-star" tone="error" title="خطأ" />
      <Icon name="give-star" tone="warning" title="تحذير" />
      <Icon name="give-star" tone="information" title="معلومة" />
    </div>
  ),
};

/** `git-compare` is visually asymmetric, so the flip is easy to see. `mirrorInRTL`
 * is opt-in per usage — per-icon directionality isn't derivable from the Figma
 * source (docs/ICON_LIBRARY.md — Known Limitations). */
export const RTL: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div
        dir="ltr"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
      >
        <span>LTR</span>
        <Icon name="git-compare" mirrorInRTL title="مقارنة" />
      </div>
      <div
        dir="rtl"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
      >
        <span>RTL (معكوس)</span>
        <Icon name="git-compare" mirrorInRTL title="مقارنة" />
      </div>
    </div>
  ),
};

/** Decorative icons are hidden from assistive tech — appropriate when the icon
 * sits beside text that already conveys its meaning, or inside a control that
 * carries its own `aria-label`. */
export const Decorative: Story = {
  render: () => (
    <button
      type="button"
      aria-label="حذف العنصر"
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
    >
      <Icon name="zakat-bag-open" decorative />
      <span>حذف</span>
    </button>
  ),
};

/** Functional icons expose `role="img"` + the given name to assistive tech. */
export const Accessible: Story = {
  args: { name: 'sheep-01', title: 'الأضحية' },
};

/** One category rendered at a time — bounded, and reflects the official
 * category structure preserved by the import pipeline. */
export const CategoryPreview: Story = {
  name: 'Category preview',
  render: () => {
    const category = iconCategories['home'];
    return (
      <div>
        <h3 style={{ margin: '0 0 0.75rem' }}>{category.label}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {category.icons.map((name) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Icon name={name} size="featured" title={name} />
              <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

function SearchableGallery() {
  const [query, setQuery] = useState('');
  const allNames = useMemo(() => Object.keys(iconRegistry) as IconName[], []);
  const filtered = useMemo(
    () =>
      query.trim() === ''
        ? allNames
        : allNames.filter((name) => name.includes(query.trim().toLowerCase())),
    [allNames, query]
  );

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن أيقونة… (e.g. home, git)"
        style={{ padding: '0.5rem 0.75rem', width: '280px', marginBottom: '1rem' }}
      />
      <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
        {filtered.length} / {allNames.length} أيقونة
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1rem' }}>
        {filtered.map((name) => (
          <div
            key={name}
            title={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Icon name={name} size="featured" decorative />
            <span
              style={{
                fontSize: '0.625rem',
                color: '#6b7280',
                textAlign: 'center',
                wordBreak: 'break-all',
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Client-side filter over the full registry. Fine at pilot scale (49 icons);
 * revisit (virtualize) once the full ~4,400-icon library is imported. */
export const SearchableGalleryStory: Story = {
  name: 'Searchable gallery',
  render: () => <SearchableGallery />,
};
