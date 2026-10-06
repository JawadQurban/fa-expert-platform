import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '../Icon/Icon';
import { TrailingIcon } from '../TrailingIcon/TrailingIcon';
import { SearchBox } from './SearchBox';

const meta = {
  title: 'Primitives/SearchBox',
  component: SearchBox,
  parameters: {
    docs: {
      description: {
        component:
          "Verified live against the official Platforms Code Figma Search Box component set (`docs/FIGMA_SEARCH_BOX_SPECIFICATION.md`). Field chrome reuses `TextInput`'s own verified tokens directly — this primitive adds only one new token (the helper-icon size).",
      },
    },
  },
  args: { label: 'Search' },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    surface: { control: 'inline-radio', options: ['default', 'filledDarker', 'filledLighter'] },
  },
} satisfies Meta<typeof SearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTrailingIcon: Story = {
  args: {
    trailingIcon: <TrailingIcon icon={<Icon name="cancel-01" decorative />} label="Clear" />,
  },
};

export const WithHelper: Story = {
  args: { helperText: 'Search by title, category, or keyword.' },
};
export const WithError: Story = { args: { errorText: 'Enter at least 2 characters.' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'قيمة للقراءة فقط' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Search' } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
      <SearchBox {...args} size="lg" label="Large" />
      <SearchBox {...args} size="md" label="Medium" />
    </div>
  ),
};

export const Surfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
      <SearchBox {...args} surface="default" label="Default" />
      <SearchBox {...args} surface="filledDarker" label="Filled darker" />
      <SearchBox {...args} surface="filledLighter" label="Filled lighter" />
    </div>
  ),
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '20rem' }}>
      <SearchBox
        {...args}
        label="بحث"
        placeholder="ابحث هنا"
        trailingIcon={<TrailingIcon icon={<Icon name="cancel-01" decorative />} label="مسح" />}
      />
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Search Box example (node `30150:90990`): label, leading search icon, trailing clear icon, and the icon-paired helper text row.',
      },
    },
  },
  render: () => (
    <div style={{ maxInlineSize: '20rem' }}>
      <SearchBox
        label="Search"
        placeholder="Search"
        helperText="Help Text"
        trailingIcon={<TrailingIcon icon={<Icon name="cancel-01" decorative />} label="Clear" />}
      />
    </div>
  ),
};
