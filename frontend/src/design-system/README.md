# FADS Design System (source)

Reusable design system consumed by all Financial Academy products. It maps to
the DGA **Platforms Code v1.0** and never customizes the base design
(`docs/DESIGN_CONSTRAINTS.md`). Product code imports **only** from `@ds`.

> ⚠ **All component visual fidelity is "Pending final DGA token values" (Q3/Q20).**
> Styling consumes the placeholder token layer only — no hard-coded visual values.
> No pixel-perfect DGA compliance is claimed.

## Structure

- `tokens/` — CSS custom properties (⚠ placeholder values) + typed `token` map.
- `providers/` — `ThemeProvider`, `DirectionProvider` (RTL-default) + hooks.
- `primitives/` — atoms (below).
- `layout/` — Container, Section.
- `composite/` — Card, Accordion, Tabs, Alert, Notification, Loading, Pagination,
  Steps, EmptyState, ErrorState, Toast/ToastProvider, Modal, Table, FileUploader,
  DatePicker.
- `shell/` — Header, Footer, Breadcrumbs, NavDrawer.
- `patterns/` — reserved for later milestones.
- `index.ts` — the public entry.

## Implemented components (Phase 5C) — usage

```tsx
import {
  Typography,
  Icon,
  Button,
  Link,
  Tag,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  Avatar,
  Container,
  Section,
  Card,
  Accordion,
  Tabs,
  Alert,
  Notification,
  Header,
  Footer,
  Breadcrumbs,
  NavDrawer,
  Loading,
  Pagination,
  Steps,
  EmptyState,
  ErrorState,
  Toast,
  ToastProvider,
  useToast,
  Modal,
  Table,
  FileUploader,
  DatePicker,
} from '@ds';
```

| Component                  | One-line usage                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Typography`               | `<Typography as="h1" variant="display-lg">عنوان</Typography>`                                          |
| `Icon`                     | `<Icon name="home-01" title="معلومة" tone="information" />` (functional) / omit `title` for decorative |
| `Button`                   | `<Button variant="primary" loading>قدم ابتكارك</Button>`                                               |
| `Link`                     | `<Link href="…" external>الموقع الرسمي</Link>`                                                         |
| `Tag`                      | `<Tag variant="success">مقبول</Tag>` (status) / `variant="neutral"` (category)                         |
| `TextInput`                | `<TextInput label="العنوان" requiredField errorText="…" />`                                            |
| `Textarea`                 | `<Textarea label="الوصف" helperText="…" />`                                                            |
| `Select`                   | `<Select label="التصنيف" placeholder="اختر" options={[…]} />`                                          |
| `Checkbox`                 | `<Checkbox label="أوافق" indeterminate />`                                                             |
| `RadioGroup` / `Radio`     | `<RadioGroup legend="الأولوية"><Radio value="low" label="منخفض"/></RadioGroup>`                        |
| `Switch`                   | `<Switch label="الإشعارات" onCheckedChange={fn} />`                                                    |
| `Tooltip`                  | `<Tooltip content="…" placement="top"><Button/></Tooltip>`                                             |
| `Avatar`                   | `<Avatar name="قربان جواد" src="…" />`                                                                 |
| `Container`                | `<Container size="prose">…</Container>`                                                                |
| `Section`                  | `<Section aria-label="الأهداف" background="subtle"><Container>…</Container></Section>`                 |
| `Card`                     | `<Card title="…" actionable onClick={fn}>…</Card>`                                                     |
| `Accordion`                | `<Accordion label="الأسئلة الشائعة" items={[{ id, title, content }]} />`                               |
| `Tabs`                     | `<Tabs label="…" items={[{ id, label, content }]} />` (RTL-aware Arrow keys)                           |
| `Alert`                    | `<Alert tone="error" dismissible dismissLabel="إغلاق">…</Alert>` (CMP-23 Inline Alert)                 |
| `Notification`             | `<Notification tone="warning" title="…">…</Notification>` (CMP-24 Banner)                              |
| `Header`                   | `<Header title="…" nav={[{ id, label, href, selected }]} navLabel="…" />`                              |
| `Footer`                   | `<Footer links={[{ label, href }]} navLabel="…">© …</Footer>`                                          |
| `Breadcrumbs`              | `<Breadcrumbs label="…" items={[{ label, href }]} />`                                                  |
| `NavDrawer`                | `<NavDrawer open={open} onOpenChange={setOpen} toggleLabel="…">…</NavDrawer>` (focus-trapped)          |
| `Loading`                  | `<Loading variant="skeleton" lines={3} label="…" />` (CMP-31)                                          |
| `Pagination`               | `<Pagination page={page} pageCount={10} onPageChange={setPage} />` (CMP-28)                            |
| `Steps`                    | `<Steps steps={[{ id, label }]} currentId="…" onStepClick={fn} />` (CMP-21)                            |
| `EmptyState`               | `<EmptyState title="لا توجد طلبات" action={<Button>…</Button>} />` (FADS-authored)                     |
| `ErrorState`               | `<ErrorState description="…" onRetry={fn} retryLabel="…" />` (composes Alert/CMP-23)                   |
| `ToastProvider`/`useToast` | `const { showToast } = useToast(); showToast({ description: '…', tone: 'success' });` (CMP-22)         |
| `Modal`                    | `<Modal open={open} onClose={fn} title="…" footer={<Button/>}>…</Modal>` (CMP-25)                      |
| `Table`                    | `<Table columns={cols} rows={rows} getRowId={fn} caption="…" />` (CMP-27)                              |
| `FileUploader`             | `<FileUploader label="…" onFilesSelected={fn} files={files} onRemove={fn} />` (CMP-20)                 |
| `DatePicker`               | `<DatePicker label="…" value={date} onChange={setDate} />` (CMP-19, RTL-aware calendar grid)           |

Every component: TypeScript props, RTL, keyboard + visible focus, disabled state,
error state (where applicable), a Storybook story, and unit + axe tests. See each
component's JSDoc and `*.stories.tsx`.

**Not yet built:** Content Switcher (CMP-10), Menu (CMP-11), Rating (CMP-29)
(composite); Search/CMP-33 and Digital Stamp/CMP-32 (shell, blocked on Q10/Q5);
all 6 patterns. See `reports/COMPONENT_COVERAGE_REPORT.md`.

## Rules

1. Tokens only — no hard-coded color/space/type/radius/shadow/motion (DC-03).
2. Logical CSS properties only — no `left`/`right` (DC-23).
3. Every component ships its full DGA state set + accessibility contract.
4. `design-system` must not import from `@app`/product layers (enforced by ESLint).
5. New visual values → a documented placeholder token, never a literal
   (`docs/DESIGN_TOKENS.md §10`).
