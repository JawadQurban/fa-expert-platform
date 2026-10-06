import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './Accordion';

const meta = {
  title: 'Composite/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. DGA CMP-08. Single-expand disclosure list; Enter/Space toggles, Tab moves between headers.',
      },
    },
  },
  args: {
    label: 'الأسئلة الشائعة',
    items: [
      {
        id: 'a',
        title: 'ما هو برنامج الابتكار؟',
        content: 'برنامج لدعم أفكار الابتكار في القطاع المالي.',
      },
      { id: 'b', title: 'من يمكنه التقديم؟', content: 'أي موظف أو فريق داخل الأكاديمية المالية.' },
      { id: 'c', title: 'كيف يتم التقييم؟', content: 'وفق معايير الأثر والجدوى والابتكار.' },
    ],
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledItem: Story = {
  args: {
    items: [
      {
        id: 'a',
        title: 'ما هو برنامج الابتكار؟',
        content: 'برنامج لدعم أفكار الابتكار في القطاع المالي.',
      },
      { id: 'b', title: 'قسم غير متاح حاليًا', content: 'محتوى غير متاح.', disabled: true },
    ],
  },
};
