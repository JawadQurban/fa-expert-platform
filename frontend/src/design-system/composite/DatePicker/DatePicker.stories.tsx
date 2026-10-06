import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './DatePicker';
import type { DateRange } from './DatePicker';

const meta = {
  title: 'Composite/DatePicker',
  component: DatePicker,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Date Picker component set (`docs/FIGMA_DATE_PICKER_SPECIFICATION.md`). Trigger + popover calendar grid; `Arrow` keys are RTL-aware, `PageUp`/`PageDown` change month, `Esc` closes with focus restored to the trigger. Supports Hijri/Gregorian calendars, range selection, quick-option presets, and a year dropdown.',
      },
    },
  },
  args: {
    label: 'تاريخ الميلاد',
    placeholder: 'اختر تاريخًا',
    previousMonthLabel: 'الشهر السابق',
    nextMonthLabel: 'الشهر التالي',
    todayLabel: 'اليوم',
  },
  render: (args) => {
    function Demo() {
      const [value, setValue] = useState<Date | null>(args.value ?? null);
      return <DatePicker {...args} value={value} onChange={setValue} />;
    }
    return <Demo />;
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { value: new Date() } };
export const Disabled: Story = { args: { disabled: true } };

export const WithHelperText: Story = {
  args: { helperText: 'يتم اكتشاف التاريخ الهجري أو الميلادي تلقائيًا' },
};
export const WithError: Story = { args: { errorText: 'الرجاء اختيار تاريخ' } };
export const Required: Story = { args: { requiredField: true } };

export const HijriCalendar: Story = {
  args: { calendar: 'hijri', value: new Date() },
};

export const AutoDetectArabic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`calendar="auto"` (the default) shows Hijri for Arabic-family locales — pass `locale="ar"` explicitly to exercise this (independent of the app-wide RTL provider).',
      },
    },
  },
  args: { locale: 'ar', value: new Date() },
};

export const RangeMode: Story = {
  render: (args) => {
    function RangeDemo() {
      const [rangeValue, setRangeValue] = useState<DateRange>([null, null]);
      return (
        <DatePicker
          {...args}
          label="المدة"
          range
          rangeStartLabel="من"
          rangeEndLabel="إلى"
          rangeValue={rangeValue}
          onRangeChange={setRangeValue}
        />
      );
    }
    return <RangeDemo />;
  },
};

export const RangeWithQuickOptions: Story = {
  render: (args) => {
    function RangeDemo() {
      const [rangeValue, setRangeValue] = useState<DateRange>([null, null]);
      return (
        <DatePicker
          {...args}
          label="المدة"
          range
          quickOptions
          rangeStartLabel="من"
          rangeEndLabel="إلى"
          rangeValue={rangeValue}
          onRangeChange={setRangeValue}
        />
      );
    }
    return <RangeDemo />;
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <DatePicker {...args} value={new Date()} onChange={() => {}} />
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Date Picker examples (node `30150:10582`): single date, range with Quick options, and Hijri calendar — LTR and RTL.',
      },
    },
  },
  render: function OfficialReference() {
    const [single, setSingle] = useState<Date | null>(null);
    const [range, setRange] = useState<DateRange>([null, null]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <DatePicker label="Date" placeholder="DD/MM/YY" value={single} onChange={setSingle} />
        <DatePicker
          label="Range"
          range
          quickOptions
          rangeStartLabel="Start date"
          rangeEndLabel="End date"
          rangeValue={range}
          onRangeChange={setRange}
        />
        <DatePicker label="عنوان" calendar="hijri" value={single} onChange={setSingle} />
        <div dir="rtl">
          <DatePicker
            label="المدة"
            range
            quickOptions
            rangeStartLabel="من"
            rangeEndLabel="إلى"
            rangeValue={range}
            onRangeChange={setRange}
          />
        </div>
      </div>
    );
  },
};
