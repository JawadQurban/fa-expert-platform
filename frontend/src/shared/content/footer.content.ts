import fullLogoWhite from '@/assets/branding/full_logo-white.svg';
import visionLogo from '@/assets/branding/vision.png';
import aiYearLogo from '@/assets/branding/ai-year.svg';
import snapchatIcon from '@/assets/soical media/snapchat-stroke.svg?raw';
import facebookIcon from '@/assets/soical media/facebook-02-stroke.svg?raw';
import instagramIcon from '@/assets/soical media/instagram-stroke.svg?raw';
import linkedinIcon from '@/assets/soical media/linkedin-02-stroke.svg?raw';
import youtubeIcon from '@/assets/soical media/youtube-stroke.svg?raw';
import xIcon from '@/assets/soical media/new-twitter-stroke.svg?raw';
import type { Locale } from '@/types';
import type { FooterContent } from '@/shared/footer';
import { expertHubPaths } from '../../app/router/paths';
import { expertHubBranding } from './branding';

/**
 * Expert Hub footer content — the product's instance of the product-neutral
 * `FooterContent` contract (`@/shared/footer`), fed into the one shared
 * `AcademyFooter` composition (Expert Hub does **not** create its own Footer
 * component — see `DECISIONS.md` P-15). Owned by the Expert Hub boundary and
 * **Expert-Hub-neutral**: the copyright is the Expert Hub product line, never the
 * Hackathon "هاكاثون الابتكار" wording.
 *
 * Cross-boundary imports are all shared/neutral and allowed: the Footer contract
 * (`@/shared/footer`), brand/social assets (`@/assets`), and shared types
 * (`@/types`). Internal navigation targets come from the Expert Hub path registry
 * so every in-product link stays under `/expert-hub/*`; Academy corporate links
 * (about / support / policies / social) are real, external `fa.gov.sa` URLs.
 *
 * Arabic is authoritative; English is a best-effort translation for the locale
 * toggle. Editing footer wording only ever touches this file.
 */

const socialLinks: FooterContent['socialLinks'] = [
  {
    id: 'snapchat',
    label: 'Snapchat',
    icon: snapchatIcon,
    href: 'https://www.snapchat.com/add/thefa_ksa',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: facebookIcon,
    href: 'https://www.facebook.com/thefaksa1/',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: instagramIcon,
    href: 'https://www.instagram.com/thefaksa',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: linkedinIcon,
    href: 'https://www.linkedin.com/company/thefaksa',
  },
  { id: 'youtube', label: 'YouTube', icon: youtubeIcon, href: 'https://www.youtube.com/thefaksa' },
  { id: 'x', label: 'X', icon: xIcon, href: 'https://x.com/thefaksa' },
];

const ar: FooterContent = {
  groupsLabel: 'روابط التذييل',
  summaryLabel: 'المنصة',
  summaryLinks: [
    { id: 'home', label: 'الرئيسية', href: expertHubPaths.landing },
    { id: 'directory', label: 'دليل الخبراء والمدربين', href: expertHubPaths.directory },
  ],
  importantLinksLabel: 'روابط مهمة',
  importantLinks: [
    { id: 'academy', label: 'الأكاديمية المالية', href: 'https://fa.gov.sa', external: true },
    {
      id: 'about-academy',
      label: 'عن الأكاديمية',
      href: 'https://fa.gov.sa/Aboutus',
      external: true,
    },
    {
      id: 'contact-academy',
      label: 'تواصل مع الأكاديمية',
      href: 'https://fa.gov.sa/ContactUs',
      external: true,
    },
    {
      id: 'skills-framework',
      label: 'إطار المهارات المالية',
      href: 'https://fa.gov.sa/FinancialSkills/FrameworkStructure',
      external: true,
    },
  ],
  contactHeading: 'الاتصال والدعم',
  contactItems: [
    { label: 'هاتف', value: '+966 8001010015', href: 'tel:+966800101015' },
    { label: 'البريد الإلكتروني', value: 'cs@fa.gov.sa', href: 'mailto:cs@fa.gov.sa' },
    { label: 'موقعنا', value: 'مركز الملك عبدالله المالي' },
  ],
  socialHeading: 'تابعنا على',
  socialLinks,
  policyLinksLabel: 'روابط نظامية',
  policyLinks: [
    {
      id: 'privacy',
      label: 'سياسة الخصوصية',
      href: 'https://fa.gov.sa/privacy-policy',
      external: true,
    },
    {
      id: 'data-sharing',
      label: 'سياسة مشاركة البيانات',
      href: 'https://fa.gov.sa/datasharing-policy',
      external: true,
    },
    { id: 'sla', label: 'اتفاقية مستوى الخدمة', href: 'https://fa.gov.sa/SLA', external: true },
  ],
  copyright: 'منصة إدارة الخبراء والمدربين المستقلين — الأكاديمية المالية',
  logos: [
    { src: fullLogoWhite, alt: expertHubBranding.organizationName },
    { src: visionLogo, alt: 'رؤية المملكة العربية السعودية 2030' },
    { src: aiYearLogo, alt: 'عام الذكاء الاصطناعي' },
  ],
};

const en: FooterContent = {
  groupsLabel: 'Footer links',
  summaryLabel: 'Platform',
  summaryLinks: [
    { id: 'home', label: 'Home', href: expertHubPaths.landing },
    { id: 'directory', label: 'Expert & Trainer Directory', href: expertHubPaths.directory },
  ],
  importantLinksLabel: 'Important links',
  importantLinks: [
    { id: 'academy', label: 'Financial Academy', href: 'https://fa.gov.sa', external: true },
    {
      id: 'about-academy',
      label: 'About the Academy',
      href: 'https://fa.gov.sa/Aboutus',
      external: true,
    },
    {
      id: 'contact-academy',
      label: 'Contact the Academy',
      href: 'https://fa.gov.sa/ContactUs',
      external: true,
    },
    {
      id: 'skills-framework',
      label: 'Financial Skills Framework',
      href: 'https://fa.gov.sa/FinancialSkills/FrameworkStructure',
      external: true,
    },
  ],
  contactHeading: 'Contact & support',
  contactItems: [
    { label: 'Phone', value: '+966 8001010015', href: 'tel:+966800101015' },
    { label: 'Email', value: 'cs@fa.gov.sa', href: 'mailto:cs@fa.gov.sa' },
    { label: 'Location', value: 'King Abdullah Financial District' },
  ],
  socialHeading: 'Follow us',
  socialLinks,
  policyLinksLabel: 'Legal',
  policyLinks: [
    {
      id: 'privacy',
      label: 'Privacy policy',
      href: 'https://fa.gov.sa/privacy-policy',
      external: true,
    },
    {
      id: 'data-sharing',
      label: 'Data sharing policy',
      href: 'https://fa.gov.sa/datasharing-policy',
      external: true,
    },
    { id: 'sla', label: 'Service level agreement', href: 'https://fa.gov.sa/SLA', external: true },
  ],
  copyright: 'Expert & Independent Trainer Management Platform — Financial Academy',
  logos: [
    { src: fullLogoWhite, alt: expertHubBranding.organizationName },
    { src: visionLogo, alt: 'Saudi Vision 2030' },
    { src: aiYearLogo, alt: 'Year of Artificial Intelligence' },
  ],
};

const FOOTER_CONTENT: Record<Locale, FooterContent> = { ar, en };

export function getExpertHubFooterContent(locale: Locale): FooterContent {
  return FOOTER_CONTENT[locale] ?? FOOTER_CONTENT.ar;
}
