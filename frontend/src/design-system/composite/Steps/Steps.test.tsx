import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Steps } from './Steps';

const steps = [
  { id: 'data', label: 'البيانات' },
  { id: 'criteria', label: 'المعايير' },
  { id: 'documents', label: 'المستندات' },
  { id: 'review', label: 'المراجعة' },
];

describe('Steps', () => {
  it('renders a real ordered list, not role="progressbar"', () => {
    renderWithProviders(<Steps steps={steps} currentId="criteria" label="خطوات التقديم" />);
    expect(screen.getByRole('list', { name: 'خطوات التقديم' }).tagName).toBe('OL');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('marks the current step with aria-current="step"', () => {
    renderWithProviders(<Steps steps={steps} currentId="criteria" label="خطوات التقديم" />);
    expect(
      screen.getByText('المعايير').closest('li')?.querySelector('[aria-current]')
    ).toHaveAttribute('aria-current', 'step');
  });

  it('renders completed steps as non-interactive text when onStepClick is not given', () => {
    renderWithProviders(<Steps steps={steps} currentId="documents" />);
    expect(screen.queryByRole('button', { name: /البيانات/ })).not.toBeInTheDocument();
  });

  it('renders completed steps as buttons when onStepClick is given, and calls back', async () => {
    const onStepClick = vi.fn();
    const { user } = renderWithProviders(
      <Steps steps={steps} currentId="documents" onStepClick={onStepClick} />
    );
    const dataStep = screen.getByRole('button', { name: /البيانات/ });
    await user.click(dataStep);
    expect(onStepClick).toHaveBeenCalledWith('data');
  });

  it('never makes the current or future steps clickable', () => {
    const onStepClick = vi.fn();
    renderWithProviders(<Steps steps={steps} currentId="criteria" onStepClick={onStepClick} />);
    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('renders a description when provided', () => {
    renderWithProviders(
      <Steps
        steps={[{ id: 'data', label: 'البيانات', description: 'وصف الخطوة' }]}
        currentId="data"
      />
    );
    expect(screen.getByText('وصف الخطوة')).toBeInTheDocument();
  });

  it('appends the optional label when a step is marked optional', () => {
    renderWithProviders(
      <Steps
        steps={[{ id: 'data', label: 'البيانات', optional: true }]}
        currentId="data"
        optionalLabel="(اختياري)"
      />
    );
    expect(screen.getByText('(اختياري)')).toBeInTheDocument();
  });

  it('never makes a disabled completed step clickable even when onStepClick is given', () => {
    const onStepClick = vi.fn();
    renderWithProviders(
      <Steps
        steps={[
          { id: 'data', label: 'البيانات', disabled: true },
          { id: 'criteria', label: 'المعايير' },
        ]}
        currentId="criteria"
        onStepClick={onStepClick}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.getByText('البيانات').closest('li')?.querySelector('[aria-disabled]')
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders an error step distinctly (marker not rendered as completed)', () => {
    const { container } = renderWithProviders(
      <Steps
        steps={[{ id: 'data', label: 'البيانات', error: true }]}
        completedIds={['data']}
        currentId="criteria"
      />
    );
    expect(container.querySelector('[data-error="true"]')).toBeInTheDocument();
  });

  it('supports a vertical orientation', () => {
    const { container } = renderWithProviders(
      <Steps steps={steps} currentId="criteria" orientation="vertical" />
    );
    expect(container.querySelector('[data-orientation="vertical"]')).toBeInTheDocument();
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Steps steps={steps} currentId="criteria" label="خطوات التقديم" />
      </div>
    );
    expect(screen.getByRole('list', { name: 'خطوات التقديم' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Steps steps={steps} currentId="criteria" label="خطوات التقديم" />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with disabled/error/optional steps and onStepClick', async () => {
    const { container } = renderWithProviders(
      <Steps
        steps={[
          { id: 'data', label: 'البيانات' },
          { id: 'criteria', label: 'المعايير', error: true },
          { id: 'documents', label: 'المستندات', disabled: true },
          { id: 'review', label: 'المراجعة', optional: true },
        ]}
        currentId="review"
        onStepClick={vi.fn()}
        label="خطوات التقديم"
      />
    );
    await expectNoA11yViolations(container);
  });
});
