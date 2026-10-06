import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@ds/primitives';
import { Alert } from './Alert';
import type { AlertTone } from './Alert';

const meta = {
  title: 'Composite/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Inline Alert component set (`docs/FIGMA_ALERT_SPECIFICATION.md`, node `1730:46048` — 40 variants: rtl × type[Neutral/Info/Destructive/Warning/Success] × backgroundColor[White/Color] × mobile). DGA CMP-23. Confirmed genuinely distinct from `Notification`/`Toast` — three separate official component sets exist. `role` defaults to a tone-based choice (`error`/`warning` → `"alert"`, otherwise `"status"`) and can be overridden.',
      },
    },
  },
  args: {
    title: 'تنبيه',
    children: 'يرجى مراجعة البيانات المدخلة قبل المتابعة.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = {
  args: { tone: 'success', title: 'تم الحفظ', children: 'تم حفظ التغييرات بنجاح.' },
};
export const Warning: Story = {
  args: { tone: 'warning', title: 'تنبيه', children: 'قد تحتاج لمراجعة إضافية.' },
};
export const Error: Story = {
  args: { tone: 'error', title: 'خطأ', children: 'تعذر إكمال العملية.' },
};
export const Neutral: Story = {
  args: { tone: 'neutral', title: 'ملاحظة', children: 'معلومة عامة غير مرتبطة بحالة معينة.' },
};

export const TintedSurface: Story = {
  args: {
    tone: 'success',
    surface: 'tinted',
    title: 'تم الحفظ',
    children: 'تم حفظ التغييرات بنجاح.',
  },
};

export const WithAction: Story = {
  args: {
    tone: 'error',
    title: 'خطأ',
    children: 'تعذر إكمال العملية.',
    action: (
      <Button variant="tertiary" size="sm">
        إعادة المحاولة
      </Button>
    ),
    secondaryAction: (
      <Button variant="tertiary" size="sm">
        تجاهل
      </Button>
    ),
  },
};

export const Dismissible: Story = {
  args: { dismissible: true, dismissLabel: 'إغلاق', tone: 'info' },
};

export const Mobile: Story = {
  args: {
    mobile: true,
    tone: 'warning',
    title: 'تنبيه',
    children: 'قد تحتاج لمراجعة إضافية.',
    dismissible: true,
    dismissLabel: 'إغلاق',
    action: (
      <Button variant="neutral" size="lg" style={{ inlineSize: '100%' }}>
        إعادة المحاولة
      </Button>
    ),
    secondaryAction: (
      <Button variant="tertiary" size="sm" style={{ inlineSize: '100%' }}>
        تجاهل
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: '343px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithoutTitle: Story = { args: { title: undefined, children: 'رسالة بدون عنوان.' } };

export const LongContent: Story = {
  args: {
    tone: 'info',
    title: 'عنوان طويل يوضح تفاصيل إضافية حول حالة العملية الجارية في النظام',
    children:
      'هذا نص وصفي طويل يشرح بالتفصيل سبب ظهور هذا التنبيه، ويتضمن معلومات إضافية قد يحتاجها المستخدم لفهم الموقف واتخاذ الإجراء المناسب دون الحاجة لمغادرة الصفحة الحالية أو البحث عن مصادر أخرى للمعلومات.',
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Alert {...args} />
    </div>
  ),
};

const tones: AlertTone[] = ['neutral', 'info', 'success', 'warning', 'error'];
const toneLabel: Record<AlertTone, string> = {
  neutral: 'محايد',
  info: 'معلومة',
  success: 'نجاح',
  warning: 'تحذير',
  error: 'خطأ',
};

/**
 * Structured, non-flat reference matrix: Tone (rows) → Surface [White/Tinted]
 * → LTR/RTL, plus one Mobile sample per tone. Grouped by tone (not one wide
 * unstructured grid) per the correction-pass instructions.
 */
export const OfficialFigmaMatrix: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {tones.map((tone) => (
        <section key={tone}>
          <h3 style={{ marginBlockEnd: '8px' }}>
            {toneLabel[tone]} ({tone})
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBlockEnd: '12px',
            }}
          >
            {(['white', 'tinted'] as const).map((surface) =>
              (['ltr', 'rtl'] as const).map((dir) => (
                <div key={`${surface}-${dir}`} dir={dir}>
                  <Alert
                    tone={tone}
                    surface={surface}
                    title={`${toneLabel[tone]} — ${surface === 'white' ? 'أبيض' : 'ملون'} (${dir.toUpperCase()})`}
                    dismissible
                  >
                    نص توضيحي مختصر لهذه الحالة.
                  </Alert>
                </div>
              ))
            )}
          </div>
          <div style={{ maxInlineSize: '343px' }}>
            <Alert tone={tone} mobile title={`${toneLabel[tone]} — Mobile`} dismissible>
              نص توضيحي مختصر لهذه الحالة.
            </Alert>
          </div>
        </section>
      ))}
    </div>
  ),
};
