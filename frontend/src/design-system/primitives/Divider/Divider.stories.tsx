import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta = {
  title: 'Primitives/Divider',
  component: Divider,
  parameters: {
    docs: {
      description: {
        component:
          'Colors and thickness are sourced from the official Figma Divider component — see `docs/FIGMA_DIVIDER_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md`. `inset`/`fullWidth` are FADS-authored conveniences (no official Figma variant exists for either) built from the existing shared spacing scale.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    color: { control: 'inline-radio', options: ['neutral', 'primary', 'white', 'alphaWhite'] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: '320px' }}>
      <p>قسم أول من المحتوى</p>
      <Divider {...args} />
      <p>قسم ثانٍ من المحتوى</p>
    </div>
  ),
};

export const Inset: Story = {
  args: { inset: true },
  render: (args) => (
    <div style={{ width: '320px', border: '1px dashed #ccc' }}>
      <p>يوضّح الإطار المتقطّع حواف الحاوية مقابل الخط المُزاح للداخل.</p>
      <Divider {...args} />
      <p>محتوى بعد الفاصل.</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '48px' }}>
      <span>عنصر أول</span>
      <Divider {...args} />
      <span>عنصر ثانٍ</span>
      <Divider {...args} />
      <span>عنصر ثالث</span>
    </div>
  ),
};

/** `white`/`alphaWhite` are meant for placement on a colored/dark surface — the
 * official component's own `Alpha-white` variant is specifically for this case. */
export const DarkBackground: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        background: '#104631',
        color: '#ffffff',
        width: '320px',
      }}
    >
      <span>خط أبيض كامل التعتيم</span>
      <Divider color="white" />
      <span>خط أبيض شفاف (30%)</span>
      <Divider color="alphaWhite" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '320px' }}>
      <Divider color="neutral" />
      <Divider color="primary" />
      <div style={{ background: '#104631', padding: '0.5rem' }}>
        <Divider color="white" />
      </div>
      <div style={{ background: '#104631', padding: '0.5rem' }}>
        <Divider color="alphaWhite" />
      </div>
    </div>
  ),
};

/** Verifies the divider renders correctly under an RTL document direction — logical
 * properties only, no physical left/right, so orientation/inset are unaffected. */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ width: '320px' }}>
      <p>قسم أول من المحتوى</p>
      <Divider {...args} inset />
      <p>قسم ثانٍ من المحتوى</p>
    </div>
  ),
};
