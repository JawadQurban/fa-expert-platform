import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'Composite/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'Colors, radius, gap, shadow, and typography are sourced from the official Figma Card component — see `docs/FIGMA_CARD_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md`. DGA CMP-07. `actionable` makes the whole card a single focusable target — DGA requires exactly one action per actionable card (no nested interactive elements). The official Selectable (checkbox multi-select) and Expandable (accordion) types, and the Image/Featured-icon/Tags/Rating slots, are not implemented — documented as missing in the compliance report.',
      },
    },
  },
  args: {
    title: 'فكرة مبتكرة في الخدمات المالية',
    description: 'مقترح لتحسين تجربة المستخدم في التطبيق المصرفي.',
    children: 'تفاصيل إضافية حول الفكرة والفريق المقترح.',
  },
  argTypes: {
    effect: { control: 'inline-radio', options: ['shadow', 'none', 'stroke'] },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {};
export const NoShadow: Story = { args: { effect: 'none' } };
export const Stroke: Story = { args: { effect: 'stroke' } };
export const Actionable: Story = { args: { actionable: true } };
export const Disabled: Story = { args: { actionable: true, disabled: true } };
export const WithFooter: Story = {
  args: { footer: 'آخر تحديث: منذ يومين' },
};

/** All three official Effect variants side by side (With Shadow / No Shadow / Stroke). */
export const Effects: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Card {...args} effect="shadow" />
      <Card {...args} effect="none" />
      <Card {...args} effect="stroke" />
    </div>
  ),
};

/** actionable card's Hover/Focused/Disabled treatment, borrowed from the official
 * Type=Selectable state set (the closest verified analog — see the compliance
 * report). Tab to the second card to see the Focused border. */
export const ActionableStates: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Card {...args} actionable title="افتراضي" />
      <Card {...args} actionable disabled title="معطل" />
    </div>
  ),
};
