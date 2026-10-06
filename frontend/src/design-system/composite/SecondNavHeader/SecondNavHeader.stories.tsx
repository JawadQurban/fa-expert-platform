import type { Meta, StoryObj } from '@storybook/react';
import { Button, Icon } from '@ds/primitives';
import { SecondNavHeader, SecondNavHeaderItem } from './SecondNavHeader';

const meta = {
  title: 'Composite/SecondNavHeader',
  component: SecondNavHeader,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "Second Nav Header" — live-Figma-verified (see docs/FIGMA_SECOND_NAV_HEADER_SPECIFICATION.md). A secondary nav bar above/below the primary Header.',
      },
    },
  },
} satisfies Meta<typeof SecondNavHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoActions = (
  <>
    <Button
      size="sm"
      aria-label="Zoom in"
      iconStart={<Icon name="information-circle" size="sm" decorative />}
    />
    <Button
      size="sm"
      aria-label="Zoom out"
      iconStart={<Icon name="information-circle" size="sm" decorative />}
    />
  </>
);

export const Gray: Story = {
  render: () => (
    <SecondNavHeader actions={demoActions}>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Cloudy
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        3-Sep-2024
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        2:30 PM
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Al-Riyadh
      </SecondNavHeaderItem>
    </SecondNavHeader>
  ),
};

export const Primary: Story = {
  render: () => (
    <SecondNavHeader variant="primary" actions={demoActions}>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Cloudy
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        2:30 PM
      </SecondNavHeaderItem>
    </SecondNavHeader>
  ),
};

export const WithoutDivider: Story = {
  render: () => (
    <SecondNavHeader divider={false}>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Al-Riyadh
      </SecondNavHeaderItem>
    </SecondNavHeader>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <SecondNavHeader actions={demoActions}>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Cloudy
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        3-Sep-2024
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        2:30 PM
      </SecondNavHeaderItem>
      <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
        Al-Riyadh
      </SecondNavHeaderItem>
    </SecondNavHeader>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <SecondNavHeader actions={demoActions}>
        <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
          غائم
        </SecondNavHeaderItem>
        <SecondNavHeaderItem icon={<Icon name="information-circle" size="md" decorative />}>
          الرياض
        </SecondNavHeaderItem>
      </SecondNavHeader>
    </div>
  ),
};
