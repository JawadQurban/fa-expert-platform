import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Steps.module.css';

/**
 * Steps (FADS composite — DGA CMP-21, official Figma name "Progress Indicator").
 *
 * Verified live against the official Platforms Code Figma **Progress Indicator**
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:68350` — 48 variants:
 * `rtl` × `alignment` [Horizontal/Vertical] × `state` [Completed/Current/Upcomming]
 * × `hover` × `focused`) via the Figma MCP — see
 * `docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Steps/VISUAL_COMPLIANCE_STEPS.md`.
 *
 * This is a **Stepper**, not a numeric progress bar — semantics follow the WAI-ARIA
 * ordered-list pattern (`<ol>` + `aria-current="step"`), never
 * `role="progressbar"` (that role is reserved for measurable numeric progress,
 * which this component does not represent).
 *
 * Per `INTERACTION_SPECIFICATION.md` §4, navigation is **via the step buttons
 * only, not free-jump** — steps before the current one are rendered as buttons
 * only when `onStepClick` is given (and are otherwise plain, non-interactive
 * text), and future steps are never clickable.
 *
 * Only 3 official states exist (Completed/Current/Upcoming) — no Disabled or
 * Error state is defined in Figma. `disabled`/`error` per-step flags are
 * implemented anyway (the task requires supporting them) using this design
 * system's existing cross-cutting `Global`/`Text`/`Border` disabled/error
 * tokens (already live-verified by other approved components) rather than
 * inventing new Stepper-specific colors — flagged Needs Confirmation, not
 * pixel-verified for this component specifically (spec §4).
 */
export interface StepItem {
  readonly id: string;
  readonly label: ReactNode;
  /** Maps to the official `showDescription` content property. */
  readonly description?: ReactNode;
  /** FADS-authored extension (no official Figma Optional state) — appends `optionalLabel`. */
  readonly optional?: boolean;
  /** FADS-authored extension (no official Figma Disabled state) — non-interactive, muted. */
  readonly disabled?: boolean;
  /** FADS-authored extension (no official Figma Error state) — marker/text recolored to error tokens. */
  readonly error?: boolean;
}

export type StepsOrientation = 'horizontal' | 'vertical';

export interface StepsProps {
  readonly steps: StepItem[];
  readonly currentId: string;
  /** Explicit set of completed step ids. Defaults to every step before `currentId`. */
  readonly completedIds?: string[];
  /** When given, completed steps become clickable buttons that call back with the step id. */
  readonly onStepClick?: (id: string) => void;
  /** Maps to the official `Alignment` property. */
  readonly orientation?: StepsOrientation;
  /** Accessible label for the steps list. Defaults to English; pass a localized string. */
  readonly label?: string;
  /** Suffix appended to a step marked `optional`. Defaults to English; pass a localized string. */
  readonly optionalLabel?: string;
  readonly className?: string;
}

export function Steps({
  steps,
  currentId,
  completedIds,
  onStepClick,
  orientation = 'horizontal',
  label = 'Progress',
  optionalLabel = '(Optional)',
  className,
}: StepsProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentId);
  const instanceId = useId();

  return (
    <ol className={cn(styles.steps, className)} data-orientation={orientation} aria-label={label}>
      {steps.map((step, index) => {
        const current = step.id === currentId;
        const completed = completedIds ? completedIds.includes(step.id) : index < currentIndex;
        const clickable = Boolean(onStepClick) && completed && !current && !step.disabled;
        const isLast = index === steps.length - 1;
        const labelId = `${instanceId}-${step.id}-label`;

        const marker = (
          <span
            className={styles.marker}
            data-current={current || undefined}
            data-completed={completed || undefined}
            data-disabled={step.disabled || undefined}
            data-error={step.error || undefined}
            aria-hidden="true"
          >
            {completed && !step.error ? (
              <svg className={styles.check} viewBox="0 0 16 16" focusable="false">
                <path
                  d="M3 8.5L6.5 12L13 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              index + 1
            )}
          </span>
        );

        const text = (
          <span className={styles.text}>
            <span id={labelId} className={styles.label}>
              {step.label}
              {step.optional && <span className={styles.optional}> {optionalLabel}</span>}
            </span>
            {step.description != null && (
              <span className={styles.description}>{step.description}</span>
            )}
          </span>
        );

        return (
          <li key={step.id} className={styles.item} data-orientation={orientation}>
            <div className={styles.step}>
              {clickable ? (
                <button
                  type="button"
                  className={styles.trigger}
                  aria-labelledby={labelId}
                  onClick={() => onStepClick?.(step.id)}
                >
                  {marker}
                </button>
              ) : (
                <span
                  className={styles.trigger}
                  aria-current={current ? 'step' : undefined}
                  aria-disabled={step.disabled || undefined}
                >
                  {marker}
                </span>
              )}
              {!isLast && (
                <span
                  className={styles.connector}
                  data-completed={completed || undefined}
                  aria-hidden="true"
                />
              )}
            </div>
            {text}
          </li>
        );
      })}
    </ol>
  );
}
