import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from './FileUploader';
import type { UploadedFile } from './FileUploader';

const meta = {
  title: 'Composite/FileUploader',
  component: FileUploader,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma File Upload / Single and / Multiple component sets (`docs/FIGMA_FILE_UPLOAD_SPECIFICATION.md`). The two variants have genuinely different chrome — `variant="single"` has no drop-zone box, `variant="multiple"` (default) does. Drag-and-drop with a required click/keyboard alternative (WCAG 2.5.7) via a hidden input triggered by the Browse button; status list is `aria-live="polite"`.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['single', 'multiple'] },
  },
  args: {
    label: 'اسحب الملفات هنا أو',
    hint: 'PDF أو Word، حتى 10 ميغابايت',
    browseLabel: 'استعراض الملفات',
    removeLabel: 'إزالة',
    onFilesSelected: (files: File[]) => console.log('selected', files),
  },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleEmpty: Story = { args: { variant: 'multiple' } };

export const SingleEmpty: Story = {
  args: { variant: 'single', label: 'رفع ملف', requiredField: true },
};

export const WithFiles: Story = {
  args: {
    files: [
      { id: '1', name: 'idea.pdf', status: 'success' },
      { id: '2', name: 'business-plan.docx', status: 'uploading', progress: 55 },
      {
        id: '3',
        name: 'budget.xlsx',
        status: 'error',
        errorMessage: 'الملف كبير جدًا (الحد الأقصى 10 ميغابايت)',
      },
    ] satisfies UploadedFile[],
  },
};

export const SingleWithFile: Story = {
  args: {
    variant: 'single',
    label: 'رفع ملف',
    files: [{ id: '1', name: 'idea.pdf', status: 'success' }] satisfies UploadedFile[],
  },
};

export const Disabled: Story = { args: { disabled: true } };
export const DisabledSingle: Story = { args: { variant: 'single', disabled: true } };

export const Interactive: Story = {
  render: (args) => {
    function Demo() {
      const [files, setFiles] = useState<UploadedFile[]>([]);
      return (
        <FileUploader
          {...args}
          files={files}
          onFilesSelected={(selected) => {
            setFiles((current) => [
              ...current,
              ...selected.map((file, index) => ({
                id: `${Date.now()}-${index}`,
                name: file.name,
                status: 'success' as const,
              })),
            ]);
          }}
          onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        />
      );
    }
    return <Demo />;
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '24rem' }}>
      <FileUploader
        {...args}
        files={[{ id: '1', name: 'فكرة.pdf', status: 'success' }] satisfies UploadedFile[]}
      />
    </div>
  ),
};
