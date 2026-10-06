import type { Meta, StoryObj } from '@storybook/react';
import { Steps } from './Steps';

const meta = {
  title: 'Composite/Steps',
  component: Steps,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Progress Indicator component set (`docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md`, node `30150:68350` — 48 variants: rtl × alignment[Horizontal/Vertical] × state[Completed/Current/Upcoming] × hover × focused). DGA CMP-21. A Stepper (ordered list + `aria-current="step"`), never `role="progressbar"`. Navigation is via step buttons only when `onStepClick` is given — never free-jump. `disabled`/`error`/`optional` are FADS-authored extensions (no official Figma state) using this design system\'s existing cross-cutting tokens.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  args: {
    label: 'خطوات التقديم',
    steps: [
      { id: 'data', label: 'البيانات', description: 'أدخل بيانات الفكرة الأساسية' },
      { id: 'criteria', label: 'المعايير', description: 'حدد معايير التقييم' },
      {
        id: 'documents',
        label: 'المستندات',
        description: 'أرفق المستندات الداعمة',
        optional: true,
      },
      { id: 'review', label: 'المراجعة', description: 'راجع الطلب قبل الإرسال' },
    ],
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = { args: { currentId: 'data' } };
export const MiddleStep: Story = { args: { currentId: 'documents' } };
export const LastStep: Story = { args: { currentId: 'review' } };
export const NavigableCompletedSteps: Story = {
  args: { currentId: 'documents', onStepClick: (id: string) => console.log(`Navigate to ${id}`) },
};
export const Vertical: Story = { args: { currentId: 'documents', orientation: 'vertical' } };
export const WithDisabledStep: Story = {
  args: {
    currentId: 'criteria',
    steps: [
      { id: 'data', label: 'البيانات' },
      { id: 'criteria', label: 'المعايير' },
      { id: 'documents', label: 'المستندات', disabled: true },
      { id: 'review', label: 'المراجعة' },
    ],
  },
};
export const WithErrorStep: Story = {
  args: {
    currentId: 'documents',
    steps: [
      { id: 'data', label: 'البيانات' },
      { id: 'criteria', label: 'المعايير', error: true },
      { id: 'documents', label: 'المستندات' },
      { id: 'review', label: 'المراجعة' },
    ],
  },
};
export const RTL: Story = {
  args: { currentId: 'criteria' },
  render: (args) => (
    <div dir="rtl">
      <Steps {...args} />
    </div>
  ),
};
