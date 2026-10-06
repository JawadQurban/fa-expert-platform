import { describe, expect, it } from 'vitest';

import { getMyApplicationsContent } from './features/applications/myApplications.content';
import { getApplicationDetailContent } from './features/applications/applicationDetail.content';
import { getDirectoryContent } from './features/directory/directory.content';
import { getEngagementsContent } from './features/engagements/engagements.content';
import { getProfileContent } from './features/profile/profile.content';
import { getHomeContent } from './features/home/home.content';
import { getHeaderContent } from './shared/content/header.content';

/**
 * Business review «ملاحظات منصة الخبراء.xlsx», 2026-10-01.
 *
 * Pins the copy the reviewer named, so a later edit that quietly reverts one of
 * these comes back as a failure instead of a surprise in the next review. The
 * G-02 Latin-digit rule has its own guard in `shared/formatting.test.ts`.
 *
 * The owner's 2026-10-06 answers (`P-333`–`P-340`) are pinned where they
 * changed copy here; the agreement file (UI-07) and the public profile
 * (UI-13/27/28) are covered by their own feature and contract tests. Still
 * left out, because nothing is built: UI-09 (bank name stays free text by
 * ruling) and UI-16 (programmes delivered await a FAST endpoint, `P-337`). See
 * `docs/reviews/business-review-2026-10-01.md`.
 */

const ar = {
  applications: getMyApplicationsContent('ar'),
  applicationDetail: getApplicationDetailContent('ar'),
  directory: getDirectoryContent('ar'),
  engagements: getEngagementsContent('ar'),
  profile: getProfileContent('ar'),
  header: getHeaderContent('ar'),
  home: getHomeContent('ar'),
};

describe('UI-02 — My Applications description', () => {
  it('reads «وحالاتها» rather than «وحالتها الحية»', () => {
    expect(ar.applications.description).toBe(
      'تابع جميع طلبات انضمامك وحالاتها في مكان واحد، وأكمل مسوداتك أو قدّم طلبًا جديدًا.'
    );
  });
});

describe('UI-03 — the "start a new application" CTA', () => {
  it('names the primary action «تقديم طلب جديد»', () => {
    expect(ar.applications.actions.newApplication).toBe('تقديم طلب جديد');
  });

  it('offers it once — the empty state no longer carries a second CTA (P-339)', () => {
    // Owner ruling, item 11 «A»: one control labelled «تقديم طلب جديد». Two
    // links with one name to one route was a WCAG 2.4.4 failure, so the empty
    // state's own CTA was removed rather than relabelled.
    expect('applyNow' in ar.applications.actions).toBe(false);
  });

  it('leaves the public header as an invitation to apply, not a "new" application', () => {
    // An anonymous visitor has no applications, so «جديد» would be wrong there.
    // Flagged for the business in BUSINESS-REVIEW-2026-10-01.md.
    expect(ar.header.applyLabel).toBe('قدّم طلب الانضمام');
  });
});

describe('UI-04 — application statistic cards', () => {
  it('names the subject of each count', () => {
    expect(ar.applications.summary.underReview).toBe('الطلبات قيد المعالجة');
    expect(ar.applications.summary.approved).toBe('الطلبات المعتمدة');
    expect(ar.applications.summary.requiresAction).toBe('الطلبات التي تتطلب إجراءً');
  });

  it('keeps the application STATUS vocabulary untouched', () => {
    // The status map is the wire vocabulary, not a card label.
    expect(ar.applications.statuses.approved).not.toBe('الطلبات المعتمدة');
  });
});

describe('UI-01/UI-04 — Portal Home uses the same card labels (P-339)', () => {
  it('matches My Applications', () => {
    expect(ar.home.metrics.inProgress).toBe(ar.applications.summary.underReview);
    expect(ar.home.metrics.approved).toBe(ar.applications.summary.approved);
  });
});

describe('UI-05 — agreement sent date', () => {
  it('states that the agreement was sent to the applicant', () => {
    expect(ar.applicationDetail.agreementPreview.sentAt('2026-09-30')).toBe(
      'تم إرسال الاتفاقية إليك بتاريخ 2026-09-30'
    );
  });
});

describe('UI-08 — banking wording', () => {
  it('says «المصرفية» on the profile section', () => {
    expect(ar.profile.bankData.heading).toBe('البيانات المصرفية');
  });

  it('leaves the bank NOUN alone — «اسم البنك» is correct', () => {
    expect(ar.profile.bankData.fields.bankName).toBe('اسم البنك');
  });
});

describe('UI-11 — directory naming', () => {
  it('uses the full name for the directory’s own heading', () => {
    expect(ar.directory.title).toBe('دليل الخبراء والمدربين المعتمدين');
  });

  it('uses the short name in the document title', () => {
    expect(ar.directory.documentTitle).toContain('دليل الخبراء والمدربين');
  });
});

describe('UI-12 — directory description', () => {
  it('was already correct and stays that way', () => {
    expect(ar.directory.description).toBe(
      'تصفّح نخبة الخبراء والمدربين المعتمدين الذين وافقوا على الظهور العام، وابحث عنهم بالاسم.'
    );
  });
});

describe('UI-17 — the view-profile action', () => {
  it('reads «عرض الملف التعريفي»', () => {
    expect(ar.directory.card.viewProfileShort).toBe('عرض الملف التعريفي');
  });

  it('still offers a per-trainer accessible name for the repeated link', () => {
    // 2.4.9: the visible label repeats on every card, so the link needs a name
    // that says WHOSE profile. This used to be dead copy.
    expect(ar.directory.card.viewProfile('د. سارة العتيبي')).toContain('د. سارة العتيبي');
  });
});

describe('UI-18 — My Engagements intro', () => {
  it('opens with the verb the reviewer asked for', () => {
    expect(ar.engagements.intro).toBe('استعرض عروض الإسناد الواردة إليك وارتباطاتك المؤكَّدة.');
  });
});

describe('UI-19 — the offer response window', () => {
  it('states three days, which is what SLA-0501 is seeded to', () => {
    // SLA-0501: duration 3, unit "days" (calendar, NOT business days) —
    // NotificationSeedData.cs. The number is runtime-configurable through the
    // SLA console, which is recorded as a drift risk in the review document.
    expect(ar.engagements.offers.windowNote).toContain('ثلاثة أيام');
  });
});

describe('UI-20 / UI-22 / UI-24 — engagement empty states', () => {
  it('UI-20: an offer arrives when the nomination is approved', () => {
    expect(ar.engagements.offers.emptyBody).toBe('سيصلك عرض إسناد عند اعتماد ترشيحك لأحد الطلبات.');
  });

  it('UI-22: the confirmed-engagements empty state says «حاليًا»', () => {
    expect(ar.engagements.engagements.emptyTitle).toBe('لا توجد ارتباطات مؤكَّدة حاليًا');
    expect(ar.engagements.engagements.emptyBody).toBe('سيظهر الارتباط هنا فور قبولك لعرض الإسناد.');
  });

  it('keeps ONE noun for the engagement across every section (UI-24)', () => {
    // «إسناد» is the OFFER; «ارتباط» is the engagement. The reviewed text for
    // UI-22/UI-23 swapped them, which would have put two nouns for the same
    // object in adjacent paragraphs. Raised in the review document.
    for (const text of [
      ar.engagements.engagements.heading,
      ar.engagements.engagements.emptyTitle,
      ar.engagements.engagements.pastHeading,
      ar.engagements.engagements.pastEmptyTitle,
    ]) {
      expect(text).toMatch(/ارتباط/);
    }
  });
});

describe('UI-23 — how an engagement reaches "previous"', () => {
  it('names the early-end and cancelled paths, not only the end date', () => {
    // OfferService.Lifecycle returns a stored `withdrawn`/`cancelled` before it
    // ever looks at the dates, so those land here immediately.
    for (const text of [
      ar.engagements.engagements.pastDescription,
      ar.engagements.engagements.pastEmptyBody,
    ]) {
      expect(text).toMatch(/أُنهي|إنهائه|أُنهيت/);
      expect(text).toMatch(/أُلغيت|إلغائه/);
    }
  });
});

describe('UI-25 — profile introduction', () => {
  it('reads as the reviewer worded it', () => {
    expect(ar.profile.subtitle).toBe(
      'اطّلع على بياناتك المعتمدة، وحدّث الحقول التي يُسمح لك بتعديلها.'
    );
  });
});

describe('UI-28 — public visibility status text', () => {
  it('names the directory rather than «للعموم»', () => {
    expect(ar.profile.visibility.toggleOnDescription).toBe('ملفك ظاهر حاليًا في الدليل العام.');
  });

  it('keeps the on/off tag wording it already had', () => {
    expect(ar.profile.visibility.on).toBe('ظاهر');
    expect(ar.profile.visibility.off).toBe('غير ظاهر');
  });
});

describe('UI-28 — the consent screen names what is published (P-335)', () => {
  it('lists exactly the six published items', () => {
    const text = ar.profile.visibility.description;
    for (const item of [
      'الاسم',
      'المجال',
      'النبذة المختصرة',
      'البرامج المقدمة مع الأكاديمية',
      'الصورة الشخصية',
      'التصنيف',
    ]) {
      expect(text).toContain(item);
    }
    expect(text).not.toContain('بياناتك المعتمدة');
    expect(text).not.toContain('المدينة');
  });
});
