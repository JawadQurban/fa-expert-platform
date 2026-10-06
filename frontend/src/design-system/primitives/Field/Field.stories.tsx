import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';

/**
 * `Field` is a render-prop wrapper, not a standalone visual control — these
 * stories render it around a plain native `<input>` to demonstrate the
 * label/helper/error/required wiring it owns. `TextInput`/`Textarea`/`Select`
 * compose it with their own styled controls; see their stories for the
 * full styled experience.
 */
const meta = {
  title: 'Primitives/Field',
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. Shared label/helper/error wiring (WCAG 3.3.1/3.3.2, 1.4.1) consumed by TextInput, Textarea, and Select via a render-prop.',
      },
    },
  },
  args: {
    label: 'عنوان الابتكار',
    children: (aria) => <input {...aria} />,
  },
  render: (args) => <Field {...args} />,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const WithHelper: Story = {
  args: { helperText: 'اجعل العنوان موجزًا ومعبّرًا عن الفكرة.' },
};
export const WithError: Story = { args: { errorText: 'الرجاء إدخال عنوان الابتكار' } };
export const CustomRequiredIndicator: Story = {
  args: { required: true, requiredIndicator: '(مطلوب)' },
};
