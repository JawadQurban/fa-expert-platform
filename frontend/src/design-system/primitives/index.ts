/**
 * FADS primitives (L2). Each maps to a DGA Platforms Code element and ships its
 * full DGA state set + accessibility contract.
 *
 * ⚠ Visual fidelity is **Pending final DGA token values (Q3/Q20)** across all
 * primitives — structure, behavior, states, RTL, and a11y are final.
 */
export { Typography } from './Typography/Typography';
export type {
  TypographyProps,
  TypographyVariant,
  TypographyWeight,
  TypographyColor,
  TypographyAlign,
} from './Typography/Typography';

export { Icon } from './Icon/Icon';
export type {
  IconProps,
  IconSize,
  IconTone,
  IconName,
  IconCategoryId,
  IconCategory,
} from './Icon/Icon';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Link } from './Link';
export type { LinkProps, LinkMood, LinkSize } from './Link';

export { Tag } from './Tag';
export type { TagProps, TagVariant, TagSize } from './Tag';

export { Field } from './Field';
export type { FieldProps, FieldAria } from './Field';

export { TextInput } from './TextInput';
export type { TextInputProps, TextInputSize, TextInputSurface } from './TextInput';

export { NumberInput } from './NumberInput/NumberInput';
export type { NumberInputProps } from './NumberInput/NumberInput';

export { InputPrefixSuffix } from './InputPrefixSuffix/InputPrefixSuffix';
export type {
  InputPrefixSuffixProps,
  InputPrefixSuffixIcon,
  InputPrefixSuffixSize,
  InputPrefixSuffixVariant,
} from './InputPrefixSuffix/InputPrefixSuffix';

export { ButtonClose } from './ButtonClose/ButtonClose';
export type { ButtonCloseProps, ButtonCloseSize } from './ButtonClose/ButtonClose';

export { FloatingButton } from './FloatingButton/FloatingButton';
export type {
  FloatingButtonProps,
  FloatingButtonVariant,
  FloatingButtonSize,
} from './FloatingButton/FloatingButton';

export { TrailingIcon } from './TrailingIcon/TrailingIcon';
export type { TrailingIconProps } from './TrailingIcon/TrailingIcon';

export { DropdownListItem } from './DropdownListItem/DropdownListItem';
export type {
  DropdownListItemProps,
  DropdownListItemType,
} from './DropdownListItem/DropdownListItem';

export { SearchBox } from './SearchBox/SearchBox';
export type { SearchBoxProps, SearchBoxSize, SearchBoxSurface } from './SearchBox/SearchBox';

export { Textarea } from './Textarea';
export type { TextareaProps, TextareaSurface } from './Textarea';

export { Select } from './Select/Select';
export type {
  SelectProps,
  SelectOption,
  SelectOptionGroup,
  SelectSize,
  SelectSurface,
} from './Select/Select';

export { Checkbox } from './Checkbox/Checkbox';
export type { CheckboxProps, CheckboxSize, CheckboxMood } from './Checkbox/Checkbox';

export { Radio, RadioGroup } from './Radio/Radio';
export type { RadioProps, RadioGroupProps, RadioMood } from './Radio/Radio';

export { Switch } from './Switch/Switch';
export type { SwitchProps } from './Switch/Switch';

export { Tooltip } from './Tooltip/Tooltip';
export type { TooltipProps, TooltipPlacement } from './Tooltip/Tooltip';

export { Avatar } from './Avatar/Avatar';
export type { AvatarProps, AvatarSize } from './Avatar/Avatar';

export { Divider } from './Divider';
export type { DividerProps, DividerOrientation, DividerColor } from './Divider';
