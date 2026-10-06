import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NavDrawer } from './NavDrawer';

const meta = {
  title: 'Shell/NavDrawer',
  component: NavDrawer,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. DGA CMP-02 (Secondary). Off-canvas mobile navigation, fully controlled via `open`/`onOpenChange`. While open: focus moves inside, `Tab`/`Shift+Tab` are trapped, `Esc` closes and returns focus to the toggle button; while closed the panel is `inert`.',
      },
    },
  },
  args: {
    title: 'التنقل',
    toggleLabel: 'فتح القائمة',
  },
  render: (args) => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <NavDrawer {...args} open={open} onOpenChange={setOpen}>
          <a href="/">الرئيسية</a>
          <a href="/requests">الطلبات</a>
          <a href="/faq">الأسئلة الشائعة</a>
        </NavDrawer>
      );
    }
    return <Demo />;
  },
} satisfies Meta<typeof NavDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
