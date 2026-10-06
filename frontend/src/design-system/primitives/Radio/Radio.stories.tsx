import type { Meta, StoryObj } from '@storybook/react';
import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Primitives/Radio',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Radio component set (`docs/FIGMA_RADIO_SPECIFICATION.md`). Arrow keys move between options within a group (native `name` grouping).',
      },
    },
  },
  args: {
    legend: 'مستوى الأولوية',
    children: (
      <>
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </>
    ),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Group: Story = {
  render: () => (
    <RadioGroup legend="مستوى الأولوية" defaultValue="med">
      <Radio value="low" label="منخفض" />
      <Radio value="med" label="متوسط" />
      <Radio value="high" label="مرتفع" />
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup legend="خطة الاشتراك" defaultValue="pro">
      <Radio value="basic" label="أساسي" description="مناسب للاستخدام الفردي." />
      <Radio value="pro" label="احترافي" description="يشمل ميزات متقدمة للفرق." />
    </RadioGroup>
  ),
};

export const Moods: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <RadioGroup legend="Primary (default)" mood="primary" defaultValue="a">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
      <RadioGroup legend="Neutral" mood="neutral" defaultValue="a">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <RadioGroup legend="مستوى الأولوية" errorText="الرجاء اختيار مستوى">
      <Radio value="low" label="منخفض" />
      <Radio value="high" label="مرتفع" />
    </RadioGroup>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <RadioGroup legend="مستوى الأولوية" readOnly defaultValue="high">
      <Radio value="low" label="منخفض" />
      <Radio value="high" label="مرتفع" />
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup legend="مستوى الأولوية" disabled defaultValue="low">
      <Radio value="low" label="منخفض" />
      <Radio value="high" label="مرتفع" />
    </RadioGroup>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <RadioGroup legend="عنوان اختيار مفرد" defaultValue="a">
        <Radio
          value="a"
          label="عنوان اختيار مفرد"
          description="يكتب المحتوى الإضافي هنا في حال احتاج العنوان إلى شرح."
        />
        <Radio value="b" label="خيار آخر" />
      </RadioGroup>
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Radio Label example (node `30195:23490`): label + helper text + error row with the alert-circle icon, both LTR and RTL.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <RadioGroup legend="Radio Label" defaultValue="a" errorText="Error/Warning message">
        <Radio
          value="a"
          label="Radio Label"
          description="When a selection needs a further detailed explanation, it goes here."
        />
      </RadioGroup>
      <div dir="rtl">
        <RadioGroup legend="عنوان اختيار مفرد" defaultValue="a" errorText="رسالة خطأ أو تحذير">
          <Radio
            value="a"
            label="عنوان اختيار مفرد"
            description="يكتب المحتوى الإضافي هنا في حال ان عنوان الاختيار يحتاج الى شرح أو تفصيل."
          />
        </RadioGroup>
      </div>
    </div>
  ),
};
