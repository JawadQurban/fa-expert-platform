import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';

/**
 * ⚠️ **Every `href` here must resolve.** `navigationTargets.test.ts` checks each
 * one against the registered route table, so a tab that goes nowhere fails the
 * build. Three of the five public tabs used to resolve to NotFound (P-119).
 *
 * Expert Hub header content — every piece of copy and every navigation target for
 * the three-level application header (Government utility bar → Service information
 * bar → Main navigation header), for both locales. Owned by the Expert Hub
 * boundary and **Expert-Hub-neutral**: no Hackathon wording, no Hackathon routes.
 *
 * Product content is kept out of the header JSX entirely — the header components
 * are pure structure driven by this config, so the navigation IA, labels, and
 * placeholder values can be edited (or later sourced from an API) in one place.
 *
 * Arabic is authoritative; English is a best-effort translation for the locale
 * toggle. Internal `href`s come from the Expert Hub path registry so every
 * in-product link stays under `/expert-hub/*`.
 *
 * ⚠️ Two areas carry deliberate placeholders (see `DECISIONS.md` P-15 / `TODO.md`):
 *   1. `gov.verifyHref` — the official "how to verify a registered government
 *      site" URL is **not yet confirmed**; `null` renders a non-navigable,
 *      clearly-disabled affordance until the real URL is supplied.
 *   2. `service.items` — the service information bar shows **static placeholder**
 *      weather/date/time/location values. Live weather/clock/location
 *      integrations are intentionally NOT implemented; the structure is kept so
 *      values can later come from an API without touching the component.
 */

export interface HeaderNavLink {
  readonly id: string;
  readonly label: string;
  /** Absolute Expert Hub path (from `expertHubPaths`) or an external URL. */
  readonly href: string;
  readonly external?: boolean;
}

export interface HeaderServiceItem {
  readonly id: string;
  readonly label: string;
}

export interface HeaderContent {
  /** Accessible name for the utility-bars region landmark (Levels 1 + 2). */
  readonly utilityRegionLabel: string;
  /** Accessible name for the main-navigation `<nav>` landmark (Level 3). */
  readonly navLabel: string;
  /** Accessible name for the responsive menu toggle. */
  readonly menuLabel: string;
  /** Accessible name for the brand/home link. */
  readonly logoLinkLabel: string;
  /** Short product name shown beside the Financial Academy brand mark. */
  readonly brandName: string;

  /** Level 1 — Government utility bar. */
  readonly gov: {
    readonly indicator: string;
    readonly verifyLabel: string;
    /** Pending confirmation — `null` renders a non-navigable placeholder. */
    readonly verifyHref: string | null;
  };

  /** Level 2 — Service information bar (STATIC PLACEHOLDER values, not live). */
  readonly service: {
    readonly items: readonly HeaderServiceItem[];
  };

  /**
   * Level 3 — Main navigation, per shell variant.
   *
   * The public list is short on purpose: it carries **pages**, and About and
   * Services are sections of the landing page, which `home` already reaches
   * (P-123).
   */
  readonly publicNav: readonly HeaderNavLink[];
  readonly portalNav: readonly HeaderNavLink[];
  readonly internalNav: readonly HeaderNavLink[];

  /** Level 3 — Actions. */
  readonly searchLabel: string;
  readonly localeToggleLabel: string;
  readonly loginLabel: string;
  readonly applyLabel: string;
  readonly logoutLabel: string;
  readonly accountLabel: string;
  /** Trigger label for the internal header's overflow ("More") menu. */
  readonly moreLabel: string;
}

const ar: HeaderContent = {
  utilityRegionLabel: 'شريط المعلومات الحكومية والخدمية',
  navLabel: 'التنقل الرئيسي',
  menuLabel: 'القائمة',
  logoLinkLabel: 'منصة إدارة الخبراء والمدربين المستقلين — الصفحة الرئيسية',
  brandName: 'منصة الخبراء والمدربين',
  gov: {
    indicator: 'موقع حكومي مسجل لدى هيئة الحكومة الرقمية',
    verifyLabel: 'كيف تحقق؟',
    verifyHref: null,
  },
  service: {
    /*
     * ⚠️ Empty on purpose (`D-22`). This carried «غائم · 3 سبتمبر 2024 · 2:30
     * مساءً · الرياض», hard coded, and was still showing September 2024 on a
     * live government site two years later. The date and time are now rendered
     * live by the bar itself; weather and location have no source, and a
     * plausible figure with nothing behind it is an invention.
     *
     * The list stays as the seam: give it items when something can supply them.
     */
    items: [],
  },
  publicNav: [
    { id: 'home', label: 'الرئيسية', href: expertHubPaths.landing },
    { id: 'directory', label: 'دليل الخبراء والمدربين', href: expertHubPaths.directory },
  ],
  portalNav: [
    { id: 'home', label: 'الرئيسية', href: expertHubPaths.home },
    { id: 'applications', label: 'طلباتي', href: expertHubPaths.applications },
    { id: 'engagements', label: 'ارتباطاتي', href: expertHubPaths.engagements },
    { id: 'submissions', label: 'المواد والمحتوى', href: expertHubPaths.submissions },
    { id: 'entitlements', label: 'مستحقاتي', href: expertHubPaths.entitlements },
    { id: 'profile', label: 'ملفي', href: expertHubPaths.profile },
  ],
  internalNav: [
    { id: 'dashboard', label: 'لوحة العمل', href: expertHubPaths.internal },
    { id: 'inbox', label: 'صندوق الطلبات', href: expertHubPaths.internalApplications },
    { id: 'serviceRequests', label: 'طلبات الخدمات', href: expertHubPaths.internalServiceRequests },
    { id: 'assignments', label: 'طلبات الإسناد', href: expertHubPaths.internalAssignments },
    { id: 'trainers', label: 'قاعدة المدربين', href: expertHubPaths.internalTrainers },
    { id: 'agreements', label: 'الاتفاقيات', href: expertHubPaths.internalAgreements },
    { id: 'submissions', label: 'المواد والمحتوى', href: expertHubPaths.internalSubmissions },
    { id: 'entitlements', label: 'المستحقات المالية', href: expertHubPaths.internalEntitlements },
    // CAP-08 (System Administrator). One entry, not two: the matrix and the
    // user–role screen are one administrative area and cross-link to each
    // other, so the header carries the area rather than each of its screens.
    { id: 'access', label: 'الأدوار والصلاحيات', href: expertHubPaths.internalAccessPermissions },
    // CAP-07 (System Administrator). One entry for four screens, same reason as
    // CAP-08: they are one administrative area and cross-link to each other.
    {
      id: 'notifications',
      label: 'الإشعارات والمهل',
      href: expertHubPaths.internalNotificationMatrix,
    },
  ],
  searchLabel: 'البحث',
  localeToggleLabel: 'English',
  loginLabel: 'تسجيل الدخول',
  applyLabel: 'قدّم طلب الانضمام',
  logoutLabel: 'تسجيل الخروج',
  accountLabel: 'حسابي',
  moreLabel: 'المزيد',
};

const en: HeaderContent = {
  utilityRegionLabel: 'Government and service information bar',
  navLabel: 'Primary navigation',
  menuLabel: 'Menu',
  logoLinkLabel: 'Expert & Independent Trainer Management Platform — Home',
  brandName: 'Expert Hub',
  gov: {
    indicator: 'A government website registered with the Digital Government Authority',
    verifyLabel: 'How to verify?',
    verifyHref: null,
  },
  service: {
    // See the Arabic block — no invented values (`D-22`).
    items: [],
  },
  publicNav: [
    { id: 'home', label: 'Home', href: expertHubPaths.landing },
    { id: 'directory', label: 'Expert & Trainer Directory', href: expertHubPaths.directory },
  ],
  portalNav: [
    { id: 'home', label: 'Home', href: expertHubPaths.home },
    { id: 'applications', label: 'My applications', href: expertHubPaths.applications },
    { id: 'engagements', label: 'My engagements', href: expertHubPaths.engagements },
    { id: 'submissions', label: 'Material & content', href: expertHubPaths.submissions },
    { id: 'entitlements', label: 'My entitlements', href: expertHubPaths.entitlements },
    { id: 'profile', label: 'My profile', href: expertHubPaths.profile },
  ],
  internalNav: [
    { id: 'dashboard', label: 'Workspace', href: expertHubPaths.internal },
    { id: 'inbox', label: 'Application inbox', href: expertHubPaths.internalApplications },
    {
      id: 'serviceRequests',
      label: 'Service requests',
      href: expertHubPaths.internalServiceRequests,
    },
    { id: 'assignments', label: 'Assignment requests', href: expertHubPaths.internalAssignments },
    { id: 'trainers', label: 'Trainer database', href: expertHubPaths.internalTrainers },
    { id: 'agreements', label: 'Agreements', href: expertHubPaths.internalAgreements },
    { id: 'submissions', label: 'Material & content', href: expertHubPaths.internalSubmissions },
    { id: 'entitlements', label: 'Entitlements', href: expertHubPaths.internalEntitlements },
    { id: 'access', label: 'Roles & permissions', href: expertHubPaths.internalAccessPermissions },
    {
      id: 'notifications',
      label: 'Notifications & deadlines',
      href: expertHubPaths.internalNotificationMatrix,
    },
  ],
  searchLabel: 'Search',
  localeToggleLabel: 'العربية',
  loginLabel: 'Log in',
  applyLabel: 'Apply to join',
  logoutLabel: 'Log out',
  accountLabel: 'My account',
  moreLabel: 'More',
};

const HEADER_CONTENT: Record<Locale, HeaderContent> = { ar, en };

export function getHeaderContent(locale: Locale): HeaderContent {
  return HEADER_CONTENT[locale] ?? HEADER_CONTENT.ar;
}
