import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta = {
  title: 'Primitives/Switch',
  component: Switch,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Switch component set (`docs/FIGMA_SWITCH_SPECIFICATION.md`). States: On / Off. Space or Enter toggles.',
      },
    },
  },
  args: { label: 'تفعيل الإشعارات' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };

export const WithDescription: Story = {
  args: {
    label: 'المزامنة التلقائية',
    description: 'تحديث البيانات تلقائيًا عند الاتصال بالإنترنت.',
  },
};

export const WithError: Story = {
  args: { errorText: 'تعذّر حفظ هذا الإعداد', defaultChecked: false },
};

export const Disabled: Story = { args: { disabled: true } };
export const DisabledOn: Story = { args: { disabled: true, defaultChecked: true } };

export const Trailing: Story = {
  args: {
    label: 'Switch Label',
    description: 'When a selection needs a further detailed explanation, it goes here.',
    trailing: true,
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Switch {...args} />
    </div>
  ),
  args: {
    label: 'عنوان المفتاح',
    description: 'يكتب المحتوى الإضافي هنا في حال احتاج العنوان إلى شرح.',
  },
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Switch Label example (node `30150:69998`): label + helper text + error row with the alert-circle icon, both leading and trailing switch layouts, LTR and RTL.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Switch
        label="Switch Label"
        description="When a selection needs a further detailed explanation, it goes here."
        errorText="Error/Warning message"
        defaultChecked
      />
      <Switch
        label="Switch Label"
        description="When a selection needs a further detailed explanation, it goes here."
        errorText="Error/Warning message"
        trailing
      />
      <div dir="rtl">
        <Switch
          label="عنوان المفتاح"
          description="يكتب المحتوى الإضافي هنا في حال ان عنوان الاختيار يحتاج الى شرح أو تفصيل."
          errorText="رسالة خطأ أو تحذير"
          defaultChecked
        />
      </div>
    </div>
  ),
};
