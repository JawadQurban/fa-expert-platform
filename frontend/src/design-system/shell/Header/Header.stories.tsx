import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

/**
 * Stories brand the Header with placeholder demo content only — the design
 * system ships no logo/name of its own; products supply their own branding
 * through the `logo` / `logoLabel` props.
 */
const DemoLogo = () => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      inlineSize: 40,
      blockSize: 40,
      borderRadius: 8,
      background: 'var(--fads-sys-header-selected-bg)',
      color: 'var(--fads-sys-header-selected-text)',
      fontWeight: 700,
    }}
  >
    ◆
  </span>
);

const meta = {
  title: 'Shell/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DGA CMP-01 (Nav Header), visual-compliance-corrected against the official Platforms Code Nav Header (see `docs/FIGMA_HEADER_SPECIFICATION.md`). Logo + platform-name slot on the leading side, inline primary nav, trailing `actions`; the inline nav collapses behind a responsive toggle below 960px. **Branding is caller-supplied** — no default logo or organization name.',
      },
    },
  },
  args: {
    logo: <DemoLogo />,
    logoLabel: 'اسم المنصة',
    logoHref: '/',
    logoLinkLabel: 'الصفحة الرئيسية',
    navLabel: 'التنقل الرئيسي',
    menuLabel: 'القائمة',
    nav: [
      { id: 'home', label: 'الرئيسية', href: '/', selected: true },
      { id: 'requests', label: 'الطلبات', href: '/requests' },
      { id: 'faq', label: 'الأسئلة الشائعة', href: '/faq' },
      { id: 'support', label: 'الدعم', href: 'https://example.com', external: true },
    ],
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <button type="button" style={{ padding: '8px 16px', borderRadius: 4 }}>
        تسجيل الدخول
      </button>
    ),
  },
};

export const WithSubmenuChevrons: Story = {
  args: {
    nav: [
      { id: 'home', label: 'الرئيسية', href: '/', selected: true },
      { id: 'services', label: 'الخدمات', href: '/services', hasSubmenu: true },
      { id: 'about', label: 'عن المنصة', href: '/about', hasSubmenu: true },
      { id: 'contact', label: 'اتصل بنا', href: '/contact', disabled: true },
    ],
  },
};

export const LogoOnly: Story = { args: { nav: [] } };

export const LabelOnlyBrand: Story = { args: { logo: undefined } };

/** Resize the preview below 960px to see the inline nav collapse into the toggle. */
export const Responsive: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
