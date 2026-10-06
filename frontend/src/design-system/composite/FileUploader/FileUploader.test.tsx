import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { FileUploader } from './FileUploader';
import type { UploadedFile } from './FileUploader';

function makeFile(name: string) {
  return new File(['content'], name, { type: 'application/pdf' });
}

describe('FileUploader', () => {
  it('renders a native, accessibility-hidden file input', () => {
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
  });

  it('opens the native file dialog via the Browse button (keyboard/click alternative)', async () => {
    const onFilesSelected = vi.fn();
    const { user } = renderWithProviders(
      <FileUploader
        label="اسحب الملفات هنا"
        browseLabel="استعراض الملفات"
        onFilesSelected={onFilesSelected}
      />
    );
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    await user.click(screen.getByRole('button', { name: 'استعراض الملفات' }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('activates the Browse button via the keyboard (Enter)', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
    const { user } = renderWithProviders(
      <FileUploader
        label="اسحب الملفات هنا"
        browseLabel="استعراض الملفات"
        onFilesSelected={vi.fn()}
      />
    );
    const button = screen.getByRole('button', { name: 'استعراض الملفات' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('calls onFilesSelected when a file is chosen via the input', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('idea.pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('resets the input value after selection, so choosing the same file again still fires', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('idea.pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledTimes(2);
  });

  it('passes the accept attribute through to the native input (browser-level filtering)', () => {
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} accept=".pdf,.docx" />
    );
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('accept', '.pdf,.docx');
  });

  it('does not perform its own type or size validation — passes every selected file through', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} accept=".pdf" />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const wrongType = new File(['x'], 'image.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [wrongType] } });
    // Selection is presentation-only (spec: validation is the caller's responsibility).
    expect(onFilesSelected).toHaveBeenCalledWith([wrongType]);
  });

  it('sets multiple on the native input only when requested', () => {
    const { container, rerender } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} />
    );
    expect(container.querySelector('input[type="file"]')).not.toHaveAttribute('multiple');
    rerender(<FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} multiple />);
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('multiple');
  });

  it('calls onFilesSelected with multiple files at once', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} multiple />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [makeFile('a.pdf'), makeFile('b.pdf')];
    fireEvent.change(input, { target: { files } });
    expect(onFilesSelected).toHaveBeenCalledWith(files);
  });

  it('calls onFilesSelected on drop (drag enter/over/drop) into the multiple drop-zone', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} variant="multiple" />
    );
    const dropzone = container.querySelector('input[type="file"]')?.parentElement;
    const file = makeFile('idea.pdf');
    fireEvent.dragEnter(dropzone!);
    fireEvent.dragOver(dropzone!, { dataTransfer: { files: [file] } });
    expect(dropzone).toHaveAttribute('data-drag-active');
    fireEvent.dragLeave(dropzone!);
    expect(dropzone).not.toHaveAttribute('data-drag-active');
    fireEvent.drop(dropzone!, { dataTransfer: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('does not accept files when disabled', () => {
    const onFilesSelected = vi.fn();
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={onFilesSelected} disabled />
    );
    const file = makeFile('idea.pdf');
    const dropzone = container.querySelector('input[type="file"]')?.parentElement;
    fireEvent.drop(dropzone!, { dataTransfer: { files: [file] } });
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(container.querySelector('input[type="file"]')).toBeDisabled();
  });

  it('renders the Single variant with no drop-zone icon/chrome', () => {
    const { container } = renderWithProviders(
      <FileUploader label="رفع ملف" onFilesSelected={vi.fn()} variant="single" />
    );
    // The drop-zone icon glyph only renders in the Multiple variant (spec §1).
    expect(container.textContent).not.toContain('⇪');
    expect(screen.getByText('رفع ملف')).toBeInTheDocument();
  });

  it('renders per-file status, including a distinct error-message row', () => {
    const files: UploadedFile[] = [
      { id: '1', name: 'idea.pdf', status: 'success' },
      { id: '2', name: 'plan.docx', status: 'error', errorMessage: 'الملف كبير جدًا' },
    ];
    renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} files={files} />
    );
    expect(screen.getByText('idea.pdf')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('الملف كبير جدًا');
  });

  it('announces the file list via aria-live', () => {
    const files: UploadedFile[] = [{ id: '1', name: 'idea.pdf', status: 'success' }];
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} files={files} />
    );
    expect(container.querySelector('ul[aria-live="polite"]')).toBeInTheDocument();
  });

  it('calls onRemove with the file id', async () => {
    const onRemove = vi.fn();
    const files: UploadedFile[] = [{ id: '1', name: 'idea.pdf', status: 'success' }];
    const { user } = renderWithProviders(
      <FileUploader
        label="اسحب الملفات هنا"
        onFilesSelected={vi.fn()}
        files={files}
        onRemove={onRemove}
        removeLabel="إزالة"
      />
    );
    await user.click(screen.getByRole('button', { name: 'إزالة idea.pdf' }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} />
      </div>
    );
    expect(screen.getByText('اسحب الملفات هنا')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const files: UploadedFile[] = [
      { id: '1', name: 'idea.pdf', status: 'uploading', progress: 40 },
    ];
    const { container } = renderWithProviders(
      <FileUploader
        label="اسحب الملفات هنا"
        hint="PDF, حتى 10 ميغابايت"
        onFilesSelected={vi.fn()}
        files={files}
        onRemove={vi.fn()}
        removeLabel="إزالة"
      />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations for the Single variant', async () => {
    const { container } = renderWithProviders(
      <FileUploader label="رفع ملف" onFilesSelected={vi.fn()} variant="single" requiredField />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <FileUploader label="اسحب الملفات هنا" onFilesSelected={vi.fn()} disabled />
    );
    await expectNoA11yViolations(container);
  });
});
