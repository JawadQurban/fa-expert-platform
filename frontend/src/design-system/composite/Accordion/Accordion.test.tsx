import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: 'ما هو البرنامج؟', content: 'محتوى القسم الأول' },
  { id: 'b', title: 'من يمكنه التقديم؟', content: 'محتوى القسم الثاني' },
  { id: 'c', title: 'قسم غير متاح', content: 'محتوى القسم الثالث', disabled: true },
];

describe('Accordion', () => {
  it('renders every header collapsed except the first by default', () => {
    renderWithProviders(<Accordion items={items} />);
    expect(screen.getByRole('button', { name: 'ما هو البرنامج؟' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'من يمكنه التقديم؟' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('region', { name: 'ما هو البرنامج؟' })).toHaveTextContent(
      'محتوى القسم الأول'
    );
  });

  it('expands a header on click and collapses the previous one', async () => {
    const { user } = renderWithProviders(<Accordion items={items} />);
    await user.click(screen.getByRole('button', { name: 'من يمكنه التقديم؟' }));
    expect(screen.getByRole('button', { name: 'من يمكنه التقديم؟' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'ما هو البرنامج؟' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('toggles with the keyboard (native button semantics)', async () => {
    const { user } = renderWithProviders(<Accordion items={items} />);
    const trigger = screen.getByRole('button', { name: 'ما هو البرنامج؟' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not expand a disabled item', () => {
    renderWithProviders(<Accordion items={items} />);
    const disabledTrigger = screen.getByRole('button', { name: 'قسم غير متاح' });
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Accordion items={items} label="الأسئلة الشائعة" />);
    await expectNoA11yViolations(container);
  });
});
