import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'الرئيسية', href: '/' },
  { label: 'الطلبات', href: '/requests' },
  { label: 'تفاصيل الطلب' },
];

const manyItems = [
  { label: 'الرئيسية', href: '/' },
  { label: 'المستوى 1', href: '/l1' },
  { label: 'المستوى 2', href: '/l2' },
  { label: 'المستوى 3', href: '/l3' },
  { label: 'المستوى 4', href: '/l4' },
  { label: 'تفاصيل الطلب' },
];

describe('Breadcrumbs', () => {
  it('renders a labelled navigation landmark', () => {
    renderWithProviders(<Breadcrumbs items={items} label="مسار التصفح" />);
    expect(screen.getByRole('navigation', { name: 'مسار التصفح' })).toBeInTheDocument();
  });

  it('renders every ancestor as a link', () => {
    renderWithProviders(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'الرئيسية' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'الطلبات' })).toHaveAttribute('href', '/requests');
  });

  it('renders the current page as non-interactive text with aria-current', () => {
    renderWithProviders(<Breadcrumbs items={items} />);
    const current = screen.getByText('تفاصيل الطلب');
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'تفاصيل الطلب' })).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Breadcrumbs items={items} label="مسار التصفح" />);
    await expectNoA11yViolations(container);
  });

  it('renders every item in full when 5 or fewer levels are given', () => {
    renderWithProviders(<Breadcrumbs items={items} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('collapses to first + ellipsis + last two when more than 5 levels are given', () => {
    renderWithProviders(<Breadcrumbs items={manyItems} />);
    expect(screen.getByRole('link', { name: 'الرئيسية' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'المستوى 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'المستوى 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'المستوى 4' })).toBeInTheDocument();
    expect(screen.getByText('تفاصيل الطلب')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /show hidden breadcrumb levels/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands the full trail in place when the ellipsis is activated', async () => {
    const { user } = renderWithProviders(<Breadcrumbs items={manyItems} />);
    await user.click(screen.getByRole('button', { name: /show hidden breadcrumb levels/i }));
    expect(screen.getByRole('link', { name: 'المستوى 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'المستوى 2' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no accessibility violations when collapsed', async () => {
    const { container } = renderWithProviders(<Breadcrumbs items={manyItems} />);
    await expectNoA11yViolations(container);
  });

  it('accepts a custom expand label', () => {
    renderWithProviders(<Breadcrumbs items={manyItems} expandLabel="عرض المستويات المخفية" />);
    expect(screen.getByRole('button', { name: 'عرض المستويات المخفية' })).toBeInTheDocument();
  });
});
