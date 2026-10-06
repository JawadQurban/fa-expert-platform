import { Fragment } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { cn } from '@utils/cn';
import { TextInput } from './TextInput';
import matrixDemoStyles from './TextInput.matrixDemo.module.css';

const meta = {
  title: 'Primitives/TextInput',
  component: TextInput,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Text Input component set (`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md`). The feedback icon in the helper/error row is not implemented pending the official DGA icon library (Q8). See the `OfficialFigmaMatrix` story for a full 288-cell side-by-side comparison against the Figma matrix (`reports/VISUAL_COMPLIANCE/TextInput/TEXTINPUT_STORYBOOK_FIGMA_DIFF.md`).',
      },
    },
  },
  args: { label: 'عنوان الابتكار', placeholder: 'أدخل عنوانًا واضحًا' },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    surface: { control: 'inline-radio', options: ['default', 'filledDarker', 'filledLighter'] },
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { requiredField: true } };
export const WithHelper: Story = {
  args: { helperText: 'اجعل العنوان موجزًا ومعبّرًا عن الفكرة.' },
};
export const WithError: Story = {
  args: { errorText: 'الرجاء إدخال عنوان الابتكار', defaultValue: '' },
};
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'قيمة للقراءة فقط' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'غير متاح' } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
      <TextInput {...args} size="lg" label="Large" />
      <TextInput {...args} size="md" label="Medium" />
    </div>
  ),
};

export const Surfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
      <TextInput {...args} surface="default" label="Default" />
      <TextInput {...args} surface="filledDarker" label="Filled darker" />
      <TextInput {...args} surface="filledLighter" label="Filled lighter" />
    </div>
  ),
};

export const PrefixSuffixIcon: Story = {
  args: {
    prefix: 'https://',
    suffix: '.sa',
    iconStart: <span aria-hidden="true">🔍</span>,
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '20rem' }}>
      <TextInput {...args} prefix="ر.س" iconStart={<span aria-hidden="true">🔍</span>} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// OfficialFigmaMatrix — reproduces the official Figma Text Input matrix's exact
// grouping and axis order, restructured into a Size → Surface → LTR/RTL → State
// hierarchy (matching how the design-team would read the Figma page section by
// section) instead of one flat oversized grid. Every one of the 288 official
// variant combinations (rtl × filled × error × size × surface × state) is still
// rendered — just grouped into ~24-cell sections instead of one 288-cell sheet,
// which is what kept the matrix within normal desktop Storybook width. See
// reports/VISUAL_COMPLIANCE/TextInput/TEXTINPUT_STORYBOOK_FIGMA_DIFF.md.
//
// Hovered/Pressed/Focused are real CSS pseudo-classes in the shipped component
// (:hover/:active/:focus-within — see TextInput.tsx's own JSDoc), so they are
// invisible in a normal static Storybook render. This story force-renders them
// via TextInput.matrixDemo.module.css, a Storybook-only demo class that
// re-declares the exact same token values as the real pseudo-class rules — not a
// component prop, not part of the public API, TextInput.tsx/TextInput.module.css
// are unchanged.
//
// Verification status: cells are marked "NC" (Needs Confirmation) unless they
// were directly sampled via a live get_design_context call against the
// registry-resolved Figma node (fileKey J0xq7JG3JKshRDzrgAM7E0, node
// 30150:130250). Un-badged cells are either directly sampled or are the
// Filled=True/Error=False/RTL=False baseline, which every state/surface/size
// combination was individually verified against for Large (this pass closed
// the earlier gap for Filled darker/lighter Hovered/Pressed/Read-only — see
// docs/FIGMA_TEXT_INPUT_SPECIFICATION.md §12 and the diff report). Badged cells
// extend a verified axis's behavior "by analog" (documented, disclosed
// reasoning, not a guess) per the same pattern already used for every other
// approved component in this codebase.
// ---------------------------------------------------------------------------

const MATRIX_SIZES = ['lg', 'md'] as const;
const MATRIX_SURFACES = ['default', 'filledDarker', 'filledLighter'] as const;
const MATRIX_DIRECTIONS = [false, true] as const;
const MATRIX_STATES = ['default', 'hovered', 'pressed', 'focused', 'readonly', 'disabled'] as const;
const MATRIX_COLUMNS = [
  { filled: true, error: false },
  { filled: false, error: false },
  { filled: true, error: true },
  { filled: false, error: true },
] as const;

const sizeLabel: Record<(typeof MATRIX_SIZES)[number], string> = { lg: 'Large', md: 'Medium' };
const surfaceLabel: Record<(typeof MATRIX_SURFACES)[number], string> = {
  default: 'Default surface',
  filledDarker: 'Filled darker',
  filledLighter: 'Filled lighter',
};
const stateLabel: Record<(typeof MATRIX_STATES)[number], string> = {
  default: 'Default',
  hovered: 'Hovered',
  pressed: 'Pressed',
  focused: 'Focused',
  readonly: 'Read Only',
  disabled: 'Disabled',
};

/**
 * Directly-verified via live `get_design_context` sampling (both the original
 * spec pass and this rebuild's follow-up pass on Filled darker/lighter ×
 * Hovered/Pressed/Read-only). Every other cell extends one of these axes "by
 * analog" and is flagged Needs Confirmation — see the block comment above.
 */
function isVerified(
  size: (typeof MATRIX_SIZES)[number],
  surface: (typeof MATRIX_SURFACES)[number],
  rtl: boolean,
  state: (typeof MATRIX_STATES)[number],
  filled: boolean,
  error: boolean
): boolean {
  if (rtl) return size === 'lg' && surface === 'default' && state === 'default' && filled && !error;
  if (error) return size === 'lg' && surface === 'default' && state === 'default' && filled;
  if (!filled) return size === 'lg' && surface === 'default' && state === 'default';
  if (size === 'lg') return true;
  return state === 'default' && surface === 'default';
}

function MatrixCell({
  surface,
  size,
  state,
  rtl,
  filled,
  error,
}: {
  surface: (typeof MATRIX_SURFACES)[number];
  size: (typeof MATRIX_SIZES)[number];
  state: (typeof MATRIX_STATES)[number];
  rtl: boolean;
  filled: boolean;
  error: boolean;
}) {
  const demoClass =
    state === 'hovered'
      ? matrixDemoStyles.forceHover
      : state === 'pressed'
        ? matrixDemoStyles.forcePressed
        : state === 'focused'
          ? matrixDemoStyles.forceFocused
          : undefined;

  const label = rtl ? 'عنوان' : 'Label';
  const placeholder = rtl ? 'نص تلميحي' : 'Entered text';
  const errorText = error ? (rtl ? 'رسالة خطأ' : 'Error message') : undefined;
  const verified = isVerified(size, surface, rtl, state, filled, error);

  return (
    <div className={cn(matrixDemoStyles.cell, !verified && matrixDemoStyles.needsConfirmation)}>
      {!verified && (
        <span
          className={matrixDemoStyles.needsConfirmationBadge}
          title="Needs Confirmation — extended by analog, not directly sampled from Figma"
        >
          NC
        </span>
      )}
      <TextInput
        label={label}
        placeholder={placeholder}
        defaultValue={filled ? placeholder : undefined}
        errorText={errorText}
        size={size}
        surface={surface}
        disabled={state === 'disabled'}
        readOnly={state === 'readonly'}
        className={demoClass}
      />
    </div>
  );
}

function MatrixDirectionGroup({
  surface,
  size,
  rtl,
}: {
  surface: (typeof MATRIX_SURFACES)[number];
  size: (typeof MATRIX_SIZES)[number];
  rtl: boolean;
}) {
  return (
    <div className={matrixDemoStyles.directionGroup} dir={rtl ? 'rtl' : 'ltr'}>
      <h4 className={matrixDemoStyles.directionHeading}>{rtl ? 'RTL' : 'LTR'}</h4>
      <div className={matrixDemoStyles.matrixGrid}>
        <div />
        {MATRIX_COLUMNS.map(({ filled, error }) => (
          <div key={`hdr-${filled}-${error}`} className={matrixDemoStyles.colHeader}>
            {filled ? 'Filled' : 'Placeholder'} · {error ? 'Error' : 'No error'}
          </div>
        ))}
        {MATRIX_STATES.map((state) => (
          <Fragment key={state}>
            <div className={matrixDemoStyles.rowLabel}>{stateLabel[state]}</div>
            {MATRIX_COLUMNS.map(({ filled, error }) => (
              <MatrixCell
                key={`${state}-${filled}-${error}`}
                surface={surface}
                size={size}
                state={state}
                rtl={rtl}
                filled={filled}
                error={error}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export const OfficialFigmaMatrix: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className={matrixDemoStyles.matrixPage}>
      <p className={matrixDemoStyles.matrixIntro}>
        Reproduces the official Figma Text Input matrix, restructured into a Size → Surface →
        LTR/RTL → State hierarchy (see{' '}
        <code>reports/VISUAL_COMPLIANCE/TextInput/TEXTINPUT_STORYBOOK_FIGMA_DIFF.md</code>) so each
        section fits normal desktop width instead of one oversized grid. Hovered/Pressed/Focused are
        forced via Storybook-only demo classes (not a component prop) since they are real CSS
        pseudo-classes in the shipped component.
      </p>
      <div className={matrixDemoStyles.legend}>
        <span className={matrixDemoStyles.legendItem}>
          Unmarked cell = directly verified against the live Figma node
        </span>
        <span className={matrixDemoStyles.legendItem}>
          <span className={matrixDemoStyles.needsConfirmationBadge} style={{ position: 'static' }}>
            NC
          </span>
          = Needs Confirmation (extended by analog — see spec §12)
        </span>
      </div>
      {MATRIX_SIZES.map((size) => (
        <section key={size} className={matrixDemoStyles.sizeSection}>
          <h2 className={matrixDemoStyles.sizeHeading}>{sizeLabel[size]}</h2>
          {MATRIX_SURFACES.map((surface) => (
            <div key={surface} className={matrixDemoStyles.surfaceSection}>
              <h3 className={matrixDemoStyles.surfaceHeading}>{surfaceLabel[surface]}</h3>
              {MATRIX_DIRECTIONS.map((rtl) => (
                <MatrixDirectionGroup key={String(rtl)} surface={surface} size={size} rtl={rtl} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
};
