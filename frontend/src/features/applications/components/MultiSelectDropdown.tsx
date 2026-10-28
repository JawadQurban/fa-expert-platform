import { useEffect, useMemo, useState } from 'react';
import { ButtonClose, Select, Tag } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationFieldOption, ApplicationFieldSchema } from '../applicationForm.types';
import { choiceLabel, choiceValue, encodeChoice } from '../fieldChoices';
import { getFormOptionsService } from '../formOptionsService';
import type { NewApplicationContent } from '../newApplication.content';
import styles from './MultiSelectDropdown.module.css';

type RuntimeState =
  | { readonly status: 'idle' | 'loading' }
  | { readonly status: 'ready'; readonly items: readonly ApplicationFieldOption[] }
  | { readonly status: 'unavailable' };

/**
 * A field's options fetched when it renders (`optionsSource`). A failed or
 * empty read is `unavailable`, never an error the applicant must clear: the
 * field keeps its static options («أخرى») and the form stays submittable.
 */
function useRuntimeOptions(field: ApplicationFieldSchema): RuntimeState {
  const source = field.optionsSource;
  const [state, setState] = useState<RuntimeState>({ status: source == null ? 'idle' : 'loading' });
  useEffect(() => {
    if (source == null) {
      return undefined;
    }
    let live = true;
    void getFormOptionsService()
      .listOptions(source)
      .then((result) => {
        if (!live) {
          return;
        }
        setState(
          result.ok && result.value.available && result.value.items.length > 0
            ? { status: 'ready', items: result.value.items }
            : { status: 'unavailable' }
        );
      });
    return () => {
      live = false;
    };
  }, [source]);
  return state;
}

/**
 * A `multi-select` with `display: 'dropdown'` — a searchable DS `Select` to
 * add a value, and the chosen values beneath it as removable `Tag`s. For lists
 * too long for a row of checkboxes: the Kingdom's cities (BUG-005) and the
 * Academy's programmes (BUG-004), both «قائمة منسدلة» in the UAT ruling.
 *
 * Composed from DS primitives only: the design system has no multi-value
 * dropdown, and a missing component is not built locally.
 *
 * The stored value is the array of choices: a static option's `value`, or a
 * fetched option's snapshot (`encodeChoice`), so the answer carries the name
 * it was given.
 */
export function MultiSelectDropdown({
  field,
  label,
  selected,
  required,
  helperText,
  error,
  locale,
  content,
  onChange,
}: {
  readonly field: ApplicationFieldSchema;
  readonly label: string;
  readonly selected: readonly string[];
  readonly required: boolean;
  readonly helperText: string | undefined;
  readonly error: string | undefined;
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  readonly onChange: (next: readonly string[]) => void;
}) {
  const runtime = useRuntimeOptions(field);
  const copy = content.multiSelect;

  // Fetched options first — they are the list's subject — then the static
  // ones («أخرى»), so «أخرى» always closes the list.
  const options = useMemo<readonly ApplicationFieldOption[]>(
    () => [...(runtime.status === 'ready' ? runtime.items : []), ...(field.options ?? [])],
    [runtime, field.options]
  );
  const chosen = new Set(selected.map(choiceValue));
  const name = (option: ApplicationFieldOption) =>
    locale === 'en' ? option.labelEn : option.labelAr;

  const add = (value: string) => {
    const option = options.find((candidate) => candidate.value === value);
    if (option == null || chosen.has(value)) {
      return;
    }
    const isStatic = (field.options ?? []).some((candidate) => candidate.value === value);
    onChange([...selected, isStatic ? value : encodeChoice(option)]);
  };
  const remove = (stored: string) => onChange(selected.filter((item) => item !== stored));

  const note = runtime.status === 'unavailable' ? copy.runtimeUnavailable : undefined;

  return (
    <div className={styles.root}>
      <Select
        label={label}
        searchable
        // Always empty: a pick is added below, and the field is free for the next.
        value=""
        options={options
          .filter((option) => !chosen.has(option.value))
          .map((option) => ({ value: option.value, label: name(option) }))}
        onValueChange={add}
        placeholder={copy.placeholder}
        noOptionsText={copy.noOptions}
        loading={runtime.status === 'loading'}
        loadingText={copy.loading}
        requiredField={required}
        helperText={[helperText, note].filter(Boolean).join(' — ') || undefined}
        errorText={error}
        readOnly={field.readOnly}
      />
      {selected.length > 0 && (
        <ul className={styles.chosen} aria-label={copy.chosen(label)}>
          {selected.map((stored) => {
            const shown = choiceLabel(field, stored, locale);
            return (
              <li key={stored} className={styles.item}>
                <Tag variant="information" size="md" rounded>
                  <bdi>{shown}</bdi>
                </Tag>
                {/* Beside the Tag, not in its icon slot: the slot is
                    decorative (`aria-hidden`), and this is a control. */}
                {field.readOnly !== true && (
                  <ButtonClose
                    size="xs"
                    label={copy.remove(shown)}
                    onClick={() => remove(stored)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
