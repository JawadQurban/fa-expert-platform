import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ContentSwitcher } from './ContentSwitcher';
import type { ContentSwitcherOption, ContentSwitcherSize } from './ContentSwitcher';

const OPTIONS: ContentSwitcherOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function ContentSwitcherDemo({
  size,
  onColor,
  options = OPTIONS,
}: {
  size?: ContentSwitcherSize;
  onColor?: boolean;
  options?: ContentSwitcherOption[];
}) {
  const [value, setValue] = useState(options[0]?.value ?? '');
  return (
    <ContentSwitcher
      label="Date range"
      options={options}
      value={value}
      onValueChange={setValue}
      size={size}
      onColor={onColor}
    />
  );
}

const meta = {
  title: 'Composite/ContentSwitcher',
  component: ContentSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Content Switcher component set (`docs/FIGMA_CONTENT_SWITCHER_SPECIFICATION.md`). Colors reuse the already-Approved `Button`\'s own tokens directly. A fully controlled `role="tablist"` — the consumer owns which content is shown for the selected `value` (no owned `tabpanel`, unlike `Tabs`).',
      },
    },
  },
  args: {
    label: 'Date range',
    options: OPTIONS,
    value: OPTIONS[0].value,
    onValueChange: () => {},
  },
} satisfies Meta<typeof ContentSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ContentSwitcherDemo />,
};

export const TwoItems: Story = {
  render: () => <ContentSwitcherDemo options={OPTIONS.slice(0, 2)} />,
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
    >
      <ContentSwitcherDemo size="sm" />
      <ContentSwitcherDemo size="md" />
      <ContentSwitcherDemo size="lg" />
    </div>
  ),
};

export const OnColor: Story = {
  render: () => (
    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#1b8354' }}>
      <ContentSwitcherDemo onColor />
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <ContentSwitcher
        label="النطاق الزمني"
        options={[
          { value: 'day', label: 'يوم' },
          { value: 'week', label: 'أسبوع' },
          { value: 'month', label: 'شهر' },
          { value: 'year', label: 'سنة' },
        ]}
        value="day"
        onValueChange={() => {}}
      />
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Content Switcher example (node `8421:71014`): every size, on the default surface and on a dark/colored surface.',
      },
    },
  },
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
    >
      <ContentSwitcherDemo size="sm" />
      <ContentSwitcherDemo size="md" />
      <ContentSwitcherDemo size="lg" />
      <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#1b8354' }}>
        <ContentSwitcherDemo onColor />
      </div>
    </div>
  ),
};
