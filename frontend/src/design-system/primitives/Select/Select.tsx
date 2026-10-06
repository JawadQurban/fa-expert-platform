import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { DropdownListItem } from '../DropdownListItem/DropdownListItem';
import styles from './Select.module.css';

/**
 * Select / Dropdown Input (FADS primitive — DGA CMP-15).
 *
 * Verified live against the official Platforms Code Figma Dropdown Input component
 * set (file `J0xq7JG3JKshRDzrgAM7E0`, node `3534:49934` — 288 variants: `rtl` ×
 * `size` × `filled` × `state` × `error` × `style`) via the Figma MCP — see
 * `docs/FIGMA_SELECT_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Select/VISUAL_COMPLIANCE_SELECT.md`.
 *
 * The official `Focused` (open) state is a real custom listbox panel (grouped
 * sections, a checkmarked selected item, `shadow-xl` elevation) that a native
 * `<select>` cannot render — this is a WAI-ARIA APG "Select-Only Combobox": DOM
 * focus stays on the trigger `role="combobox"` button the whole time,
 * `aria-activedescendant` tracks the highlighted option. The portaled listbox
 * reuses the exact position/outside-click/Escape architecture already established
 * by `DatePicker` (`createPortal` to `document.body`, `getBoundingClientRect()`
 * positioning re-measured on resize/scroll) rather than introducing a new overlay
 * framework. `useFocusTrap` is deliberately **not** used — it moves DOM focus into
 * its container, which is correct for `DatePicker`'s `role="dialog"` but wrong for
 * a combobox (per APG, focus never leaves the trigger).
 *
 * Option/group rows compose the separately-registered `DropdownListItem` primitive
 * (Batch 3 component 10) — its own live verification confirmed node `3262:27949` is
 * the exact same sub-component this file's own spec already named "Dropdown List
 * Item × N" for these rows. That pass also found two real fidelity bugs in what was
 * previously ad-hoc `<li>` markup here: the option hover background was `#f9fafb`
 * (should be `#f3f4f6`) and the row padding/gap was `4px` (should be `8px`) — both
 * fixed by this refactor. The roving `aria-activedescendant`-highlighted row (this
 * combobox's own "active" concept) maps to `DropdownListItem`'s `active` prop, which
 * renders the live-verified 2px focus border rather than a background change.
 */
export type SelectSize = 'md' | 'lg';
export type SelectSurface = 'default' | 'filledDarker' | 'filledLighter';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectOptionGroup {
  readonly label: string;
  readonly options: readonly SelectOption[];
}

export interface SelectProps {
  readonly label: ReactNode;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  readonly requiredField?: boolean;
  readonly fieldClassName?: string;
  /** Maps to the official `Size` property. */
  readonly size?: SelectSize;
  /** Maps to the official `Style` property. */
  readonly surface?: SelectSurface;
  readonly placeholder?: string;
  readonly options?: readonly SelectOption[];
  /** Maps to the official `multiSection` property — a grouped option list. */
  readonly groups?: readonly SelectOptionGroup[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  /** Shows a loading row in the open panel instead of the option list. */
  readonly loading?: boolean;
  readonly loadingText?: ReactNode;
  /** Shown in the open panel when there are no options to display. */
  readonly noOptionsText?: ReactNode;
  /** Native form participation, mirroring the selected value (same technique `Switch` uses). */
  readonly name?: string;
  readonly className?: string;
  readonly ref?: React.Ref<HTMLButtonElement>;
}

type RenderRow =
  | { readonly kind: 'group'; readonly key: string; readonly label: string }
  | {
      readonly kind: 'option';
      readonly key: string;
      readonly option: SelectOption;
      readonly index: number;
    };

function buildRows(
  options: readonly SelectOption[] | undefined,
  groups: readonly SelectOptionGroup[] | undefined
): RenderRow[] {
  if (groups?.length) {
    const rows: RenderRow[] = [];
    let index = 0;
    groups.forEach((group, groupIndex) => {
      rows.push({ kind: 'group', key: `group-${groupIndex}`, label: group.label });
      group.options.forEach((option) => {
        rows.push({ kind: 'option', key: option.value, option, index });
        index += 1;
      });
    });
    return rows;
  }
  return (options ?? []).map((option, index) => ({
    kind: 'option',
    key: option.value,
    option,
    index,
  }));
}

export function Select({
  label,
  helperText,
  errorText,
  requiredField = false,
  fieldClassName,
  size = 'lg',
  surface = 'default',
  placeholder,
  options,
  groups,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  readOnly = false,
  loading = false,
  loadingText = 'Loading…',
  noOptionsText = 'No options available',
  name,
  className,
  ref,
}: SelectProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = errorText != null && errorText !== false;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;

  const rows = useMemo(() => buildRows(options, groups), [options, groups]);
  const flatOptions = useMemo(
    () =>
      rows.filter((row): row is Extract<RenderRow, { kind: 'option' }> => row.kind === 'option'),
    [rows]
  );
  const selectedOption = flatOptions.find((row) => row.option.value === selectedValue)?.option;
  const enabledIndices = flatOptions.filter((row) => !row.option.disabled).map((row) => row.index);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [announce, setAnnounce] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const typeAheadRef = useRef('');
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const openPanel = (initialIndex?: number) => {
    if (disabled || readOnly) return;
    setOpen(true);
    const selectedIdx = flatOptions.findIndex((row) => row.option.value === selectedValue);
    const fallback = enabledIndices[0] ?? -1;
    setActiveIndex(initialIndex ?? (selectedIdx >= 0 ? selectedIdx : fallback));
  };
  const closePanel = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const commit = (index: number) => {
    const row = flatOptions[index];
    if (!row || row.option.disabled) return;
    if (!isControlled) setInternalValue(row.option.value);
    onValueChange?.(row.option.value);
    setAnnounce(row.option.label);
    closePanel();
    triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closePanel();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const row = flatOptions[activeIndex];
    const node = row ? optionRefs.current[row.option.value] : null;
    if (typeof node?.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, flatOptions]);

  const moveActive = (delta: number) => {
    if (enabledIndices.length === 0) return;
    const currentPos = enabledIndices.indexOf(activeIndex);
    let nextPos = currentPos + delta;
    if (nextPos < 0) nextPos = enabledIndices.length - 1;
    if (nextPos >= enabledIndices.length) nextPos = 0;
    setActiveIndex(enabledIndices[nextPos]);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openPanel();
        else moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openPanel();
        else moveActive(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(enabledIndices[0] ?? -1);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(enabledIndices[enabledIndices.length - 1] ?? -1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) openPanel();
        else commit(activeIndex);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closePanel();
        }
        break;
      case 'Tab':
        if (open) closePanel();
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          window.clearTimeout(typeAheadTimer.current);
          typeAheadRef.current += event.key.toLowerCase();
          const match = flatOptions.find(
            (row) =>
              !row.option.disabled &&
              row.option.label.toLowerCase().startsWith(typeAheadRef.current)
          );
          if (match) {
            if (!open) openPanel(match.index);
            else setActiveIndex(match.index);
          }
          typeAheadTimer.current = setTimeout(() => {
            typeAheadRef.current = '';
          }, 600);
        }
    }
  };

  const describedBy =
    [helperText != null ? helperId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;
  const activeOption = activeIndex >= 0 ? flatOptions[activeIndex]?.option : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(styles.field, fieldClassName, className)}
      data-disabled={disabled || undefined}
    >
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label} data-disabled={disabled || undefined}>
          {requiredField && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
          <span>{label}</span>
        </label>
      </div>
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as { current: HTMLButtonElement | null }).current = node;
        }}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeOption ? `${id}-option-${activeOption.value}` : undefined
        }
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={requiredField || undefined}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        className={styles.trigger}
        data-size={size}
        data-surface={surface}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-open={open || undefined}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.value} data-placeholder={!selectedOption || undefined} dir="auto">
          {selectedOption ? selectedOption.label : (placeholder ?? '')}
        </span>
        <span className={styles.chevron} aria-hidden="true" data-open={open || undefined} />
      </button>
      {name != null && <input type="hidden" name={name} value={selectedValue ?? ''} />}

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label={typeof label === 'string' ? label : undefined}
            className={styles.panel}
            data-surface={surface}
            style={
              position
                ? { top: position.top, left: position.left, minWidth: position.width }
                : { visibility: 'hidden' }
            }
          >
            {loading ? (
              <li className={styles.status} role="presentation">
                {loadingText}
              </li>
            ) : rows.length === 0 ? (
              <li className={styles.status} role="presentation">
                {noOptionsText}
              </li>
            ) : (
              rows.map((row) =>
                row.kind === 'group' ? (
                  <DropdownListItem key={row.key} type="groupLabel">
                    {row.label}
                  </DropdownListItem>
                ) : (
                  // WAI-ARIA APG "Select-Only Combobox": options are never independently
                  // focused or keyboard-operated — all keyboard interaction goes through
                  // the trigger's onKeyDown (Arrow keys/Enter/Escape), which drives
                  // aria-activedescendant.
                  <DropdownListItem
                    key={row.key}
                    id={`${id}-option-${row.option.value}`}
                    selected={row.option.value === selectedValue}
                    disabled={row.option.disabled}
                    active={row.index === activeIndex}
                    ref={(node) => {
                      optionRefs.current[row.option.value] = node;
                    }}
                    onMouseEnter={() => !row.option.disabled && setActiveIndex(row.index)}
                    onClick={() => commit(row.index)}
                  >
                    {row.option.label}
                  </DropdownListItem>
                )
              )
            )}
          </ul>,
          document.body
        )}

      <span className={styles.liveRegion} aria-live="polite">
        {announce}
      </span>

      {helperText != null && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {invalid && (
        <p id={errorId} className={styles.error} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}
