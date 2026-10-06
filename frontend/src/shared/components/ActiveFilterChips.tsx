import styles from './ActiveFilterChips.module.css';

/**
 * The filters currently narrowing a list, each removable on its own.
 *
 * A filter bar shows what you *can* filter by; it does not show what you
 * *are* filtered by — a `Select` sitting on «قيد المراجعة» reads the same as
 * one sitting on «الكل» unless you look at it closely. That matters most on
 * the screen where somebody says "the applications are missing": they are not
 * missing, they are filtered. The chips state the narrowing in words and let
 * it be undone one piece at a time, rather than only all-at-once via "clear".
 *
 * Presentation only — it renders the filter state the page already owns and
 * calls back to remove one. It fetches nothing and decides nothing.
 */
export interface ActiveFilterChip {
  /** Stable key for React and for the remove callback. */
  readonly id: string;
  /** What is being filtered on, e.g. «الحالة». */
  readonly label: string;
  /** The value it is narrowed to, e.g. «قيد المراجعة». */
  readonly value: string;
}

export function ActiveFilterChips({
  chips,
  heading,
  removeLabel,
  onRemove,
}: {
  readonly chips: readonly ActiveFilterChip[];
  /** Introduces the row, e.g. «التصفية النشطة». */
  readonly heading: string;
  /** Builds the remove button's accessible name from the chip's own words. */
  readonly removeLabel: (chip: ActiveFilterChip) => string;
  readonly onRemove: (id: string) => void;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={styles.row}>
      <span className={styles.label}>{heading}</span>
      {chips.map((chip) => (
        <span key={chip.id} className={styles.chip}>
          <span className={styles.chipLabel}>
            <span className={styles.chipKey}>{chip.label}: </span>
            {/* ⚠️ `bdi`: a value can be a reference, a date or a mixed
                Arabic/English string, and an isolated run keeps the colon and
                the label on the side the reader expects. */}
            <bdi>{chip.value}</bdi>
          </span>
          <button
            type="button"
            className={styles.remove}
            aria-label={removeLabel(chip)}
            onClick={() => onRemove(chip.id)}
          >
            <svg
              className={styles.removeGlyph}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
