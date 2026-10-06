import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';

/**
 * Stories brand the Footer with placeholder demo content only — the design
 * system ships no logo/name of its own; products supply their own branding
 * through the `logos` / `copyright` props.
 */
const DemoLogo = ({ label }: { label: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--fads-sys-typography-text-xs)',
      color: 'var(--fads-sys-footer-logo-label-text)',
    }}
  >
    <span
      aria-hidden="true"
      style={{
        inlineSize: 32,
        blockSize: 32,
        borderRadius: 6,
        background: 'var(--fads-sys-footer-group-label-border)',
      }}
    />
    {label}
  </span>
);

const groups = [
  {
    id: 'about',
    label: 'عن المنصة',
    links: [
      { label: 'من نحن', href: '/about' },
      { label: 'رؤيتنا', href: '/vision' },
      { label: 'الأخبار', href: '/news' },
    ],
  },
  {
    id: 'services',
    label: 'الخدمات',
    links: [
      { label: 'الخدمات الإلكترونية', href: '/services' },
      { label: 'الدعم الفني', href: '/support' },
    ],
  },
  {
    id: 'contact',
    label: 'تواصل معنا',
    links: [
      { label: 'اتصل بنا', href: '/contact' },
      { label: 'المركز الإعلامي', href: 'https://example.com', external: true },
    ],
  },
];

const meta = {
  title: 'Shell/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DGA CMP-03 (Footer), visual-compliance-corrected against the official Platforms Code Footer (see `docs/FIGMA_FOOTER_SPECIFICATION.md`). An optional grouped nav-links region plus a legal region (underlined links, semibold copyright caption, secondary links, and a caller-supplied logo slot). **Branding is caller-supplied.** `background="darkGreen"` renders the official dark-green variant.',
      },
    },
  },
  args: {
    groups,
    groupsLabel: 'روابط التذييل',
    navLabel: 'روابط إضافية',
    links: [
      { label: 'سياسة الخصوصية', href: '/privacy' },
      { label: 'الشروط والأحكام', href: '/terms' },
      { label: 'بيان إمكانية الوصول', href: '/accessibility' },
    ],
    copyright: 'جميع الحقوق محفوظة © 2026',
    secondaryLinks: [
      { label: 'الشروط والأحكام', href: '/terms' },
      { label: 'سياسة الخصوصية', href: '/privacy' },
    ],
    logos: (
      <>
        <DemoLogo label="شعار المنصة" />
        <DemoLogo label="شعار الجهة" />
      </>
    ),
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkGreen: Story = { args: { background: 'darkGreen' } };

/** Mirrors the landing-page usage: no grouped columns, just the legal region. */
export const LegalOnly: Story = {
  args: {
    groups: [],
    logos: undefined,
    secondaryLinks: [],
    copyright: undefined,
    children: 'هاكاثون الابتكار — الأكاديمية المالية.',
  },
};
