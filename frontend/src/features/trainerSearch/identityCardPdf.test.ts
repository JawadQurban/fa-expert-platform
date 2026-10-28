import { afterEach, describe, expect, it, vi } from 'vitest';
import { identityCardFileName, loadPhotoForExport } from './identityCardPdf';

describe('identityCardPdf (BUG-051, P-387)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names the file after the trainer, keeping Arabic and dropping what no file system takes', () => {
    expect(identityCardFileName('د. سارة العتيبي', 'trn-001')).toBe(
      'trainer-card-د-سارة-العتيبي.pdf'
    );
    expect(identityCardFileName('a/b:c', 'trn-001')).toBe('trainer-card-abc.pdf');
  });

  it('falls back to the trainer id when the card has no name', () => {
    expect(identityCardFileName('   ', 'trn-001')).toBe('trainer-card-trn-001.pdf');
  });

  it('reads the photo with the session cookie, and gives no photo (the initials) when it fails', async () => {
    const refused = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', refused);
    await expect(loadPhotoForExport('/v1/attachments/x')).resolves.toBeNull();
    expect(refused).toHaveBeenCalledWith('/v1/attachments/x', { credentials: 'include' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('CORS')));
    await expect(loadPhotoForExport('/v1/attachments/x')).resolves.toBeNull();
  });
});
