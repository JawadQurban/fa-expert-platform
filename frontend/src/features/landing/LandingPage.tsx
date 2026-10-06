import { useEffect, useMemo, useState } from 'react';
import { Button, Divider, Icon, Typography } from '@ds/primitives';
import { Card, ContentSwitcher, ItemIcon, Tabs } from '@ds/composite';
import type { TabItem } from '@ds/composite';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { cn } from '@utils/cn';
// Official Financial Academy assets (repo) — imported as URLs (hashed, cacheable
// files; never inlined). The branded background pattern + section photographs
// supplied by the Product Owner.
import brandPattern from '@/assets/icons/background pattern.svg';
import expertAboutImage from '@/assets/icons/expert-about.png';
import whyJoinImage from '@/assets/icons/students_gateway_why_us_500kb.webp';
import {
  getLandingContent,
  type LandingCardItem,
  type LandingContent,
  type LandingStep,
} from './landing.content';
import styles from './LandingPage.module.css';

/**
 * Expert Hub landing page (`EH-PUB-01`). Reproduces the official Financial
 * Academy "منصة الخبراء" (Expert Platform) marketing page, composed from
 * **approved Design System components only** — Section, Container, Card, Button,
 * Icon, Typography, Divider, ContentSwitcher (the About segmented tabs), Tabs
 * (the vertical join-guidelines) — and token-only, RTL-first CSS. No Design
 * System component, token, color, typography, or spacing value is created or
 * modified; richness comes from composition (CLAUDE.md — creative composition).
 * The header/footer chrome comes from the Expert Hub public shell.
 *
 * All copy/icons/CTA targets come from `landing.content.ts`. Photographs from
 * the reference are represented by token-styled placeholder panels (decorative,
 * `aria-hidden`) marked `TODO(image)` — no branding asset is invented.
 */

/** Reusable eyebrow + heading block. */
function SectionHeading({
  eyebrow,
  title,
  titleId,
  align = 'start',
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly titleId: string;
  readonly align?: 'start' | 'center';
}) {
  return (
    <div className={cn(styles.sectionIntro, align === 'center' && styles.sectionIntroCenter)}>
      <Typography as="p" variant="text-sm" weight="semibold" color="primary">
        {eyebrow}
      </Typography>
      <Typography as="h2" id={titleId} variant="display-md">
        {title}
      </Typography>
    </div>
  );
}

/** Icon-badge benefit/goal card (About → Why join / Goals panels). */
function BenefitCard({ item }: { readonly item: LandingCardItem }) {
  return (
    <Card effect="stroke" className={styles.benefitCard}>
      <ItemIcon
        contained
        icon={<Icon name={item.icon} size="featured" tone="primary" decorative />}
      />
      <Typography as="p" variant="text-md">
        {item.text}
      </Typography>
    </Card>
  );
}

/** Connected accreditation/collaboration timeline step. */
function TimelineStep({ step, index }: { readonly step: LandingStep; readonly index: number }) {
  return (
    <li className={styles.timelineItem}>
      <div className={styles.timelineMarker}>
        <span className={styles.timelineNumber} aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <Card effect="stroke" className={styles.timelineCard}>
        <ItemIcon
          contained
          icon={<Icon name={step.icon} size="featured" tone="primary" decorative />}
        />
        <Typography as="h3" variant="text-lg" weight="bold">
          {step.title}
        </Typography>
        <Typography as="p" variant="text-md" color="muted">
          {step.description}
        </Typography>
      </Card>
    </li>
  );
}

/** The About segmented panels (عن المنصة / لماذا تنضم / أهداف المنصة). */
function AboutPanels({
  content,
  active,
}: {
  readonly content: LandingContent['about'];
  readonly active: string;
}) {
  if (active === content.whyTab.id) {
    return (
      <div>
        <Typography as="h3" variant="text-lg" weight="bold" className={styles.panelHeading}>
          {content.whyTab.heading}
        </Typography>
        <img className={styles.bannerImage} src={whyJoinImage} alt="" />
        <ul className={styles.benefitGrid} aria-label={content.whyTab.heading}>
          {content.whyTab.items.map((item) => (
            <li key={item.id}>
              <BenefitCard item={item} />
            </li>
          ))}
        </ul>
        <div className={styles.panelCta}>
          <Button
            variant="primary"
            size="lg"
            href={content.whyTab.ctaHref}
            iconStart={<Icon name="add-circle" size="md" decorative />}
          >
            {content.whyTab.ctaLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (active === content.goalsTab.id) {
    return (
      <div>
        <Typography as="h3" variant="text-lg" weight="bold" className={styles.panelHeading}>
          {content.goalsTab.heading}
        </Typography>
        <ul className={styles.goalGrid} aria-label={content.goalsTab.heading}>
          {content.goalsTab.items.map((item) => (
            <li key={item.id} className={styles.goalItem}>
              <ItemIcon
                contained
                icon={<Icon name={item.icon} size="md" tone="primary" decorative />}
              />
              <Typography as="p" variant="text-md">
                {item.text}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.aboutPanel}>
      <img className={styles.sectionImage} src={expertAboutImage} alt={content.aboutTab.imageAlt} />
      <div className={styles.aboutText}>
        <Typography as="h3" variant="text-lg" weight="bold">
          {content.aboutTab.heading}
        </Typography>
        {content.aboutTab.paragraphs.map((paragraph, index) => (
          <Typography key={index} as="p" variant="text-md" color="muted">
            {paragraph}
          </Typography>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getLandingContent(locale), [locale]);
  const [aboutTab, setAboutTab] = useState(content.about.aboutTab.id);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  const aboutOptions = [
    { value: content.about.aboutTab.id, label: content.about.aboutTab.label },
    { value: content.about.whyTab.id, label: content.about.whyTab.label },
    { value: content.about.goalsTab.id, label: content.about.goalsTab.label },
  ];

  const guidelineTabs: TabItem[] = content.eligibility.tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    content: (
      <div className={styles.guidelinePanel}>
        <Typography as="h3" variant="text-lg" weight="bold">
          {tab.heading}
        </Typography>
        {tab.intro != null && (
          <Typography as="p" variant="text-md" color="muted">
            {tab.intro}
          </Typography>
        )}
        <ol className={styles.eligibilityList} aria-label={tab.heading}>
          {tab.items.map((item, index) => (
            <li key={item} className={styles.eligibilityItem}>
              <span className={styles.eligibilityNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <Typography as="span" variant="text-md">
                {item}
              </Typography>
            </li>
          ))}
        </ol>
      </div>
    ),
  }));

  return (
    <>
      {/* ── HERO ── branded background pattern (repo asset) + on-color
          invitation card. Marketing theme, approved DS tokens only. ───────── */}
      <Section
        className={styles.hero}
        style={{ backgroundImage: `url("${brandPattern}")` }}
        aria-labelledby="eh-hero-title"
      >
        <Container>
          <div className={styles.heroContent}>
            <Typography as="p" variant="text-sm" weight="semibold" color="primary">
              {content.hero.eyebrow}
            </Typography>
            <Typography as="h1" id="eh-hero-title" variant="display-xl">
              {content.hero.title}
            </Typography>
            <Typography as="p" variant="text-lg" color="muted" className={styles.heroLead}>
              {content.hero.subtitle}
            </Typography>
            <Typography as="p" variant="text-md" color="muted" className={styles.heroLead}>
              {content.hero.invitation.body}
            </Typography>
            <div className={styles.heroActions}>
              <Button
                variant="primary"
                size="lg"
                href={content.hero.invitation.ctaHref}
                iconStart={<Icon name="add-circle" size="md" decorative />}
              >
                {content.hero.invitation.ctaLabel}
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── ABOUT (segmented) ────────────────────────────────────────────── */}
      <Section background="subtle" aria-labelledby="eh-about-title">
        <Container>
          <SectionHeading
            eyebrow={content.about.eyebrow}
            title={content.about.title}
            titleId="eh-about-title"
            align="center"
          />
          <div className={styles.switcherRow}>
            <ContentSwitcher
              label={content.about.switcherLabel}
              options={aboutOptions}
              value={aboutTab}
              onValueChange={setAboutTab}
              size="lg"
            />
          </div>
          <Card effect="stroke" className={styles.aboutCard}>
            <AboutPanels content={content.about} active={aboutTab} />
          </Card>
        </Container>
      </Section>

      {/* ── ELIGIBILITY / JOIN GUIDELINES ────────────────────────────────── */}
      <Section aria-labelledby="eh-eligibility-title">
        <Container>
          <SectionHeading
            eyebrow={content.eligibility.eyebrow}
            title={content.eligibility.title}
            titleId="eh-eligibility-title"
          />
          <Tabs
            items={guidelineTabs}
            orientation="vertical"
            label={content.eligibility.guidelinesLabel}
            className={styles.guidelines}
          />

          <Card effect="shadow" className={styles.eligibilityCta}>
            <div className={styles.eligibilityCtaText}>
              <Typography as="h3" variant="text-lg" weight="bold">
                {content.eligibility.ctaTitle}
              </Typography>
              <Typography as="p" variant="text-md" color="muted">
                {content.eligibility.ctaBody}
              </Typography>
            </div>
            <Button
              variant="primary"
              size="lg"
              href={content.eligibility.ctaHref}
              iconStart={<Icon name="add-circle" size="md" decorative />}
            >
              {content.eligibility.ctaLabel}
            </Button>
          </Card>
        </Container>
      </Section>

      <Divider inset />

      {/* ── COLLABORATION (timeline) ─────────────────────────────────────── */}
      <Section background="subtle" aria-labelledby="eh-collaboration-title">
        <Container>
          <div className={cn(styles.sectionIntro, styles.sectionIntroCenter)}>
            <Typography as="p" variant="text-sm" weight="semibold" color="primary">
              {content.collaboration.eyebrow}
            </Typography>
            <Typography as="h2" id="eh-collaboration-title" variant="display-md">
              {content.collaboration.title}
            </Typography>
            <Typography as="p" variant="text-lg" color="muted">
              {content.collaboration.body}
            </Typography>
          </div>
          <ol className={styles.timeline} aria-label={content.collaboration.sectionLabel}>
            {content.collaboration.steps.map((step, index) => (
              <TimelineStep key={step.id} step={step} index={index} />
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <Section className={styles.finalCta} aria-labelledby="eh-final-cta-title">
        <Container size="prose">
          <div className={styles.finalCtaInner}>
            <Typography as="p" variant="text-sm" weight="semibold" color="primary" align="center">
              {content.finalCta.eyebrow}
            </Typography>
            <Typography as="h2" id="eh-final-cta-title" variant="display-md" align="center">
              {content.finalCta.title}
            </Typography>
            <Typography as="p" variant="text-lg" color="muted" align="center">
              {content.finalCta.body}
            </Typography>
            <div className={styles.finalCtaActions}>
              <Button
                variant="primary"
                size="lg"
                href={content.finalCta.primaryCtaHref}
                iconStart={<Icon name="add-circle" size="md" decorative />}
              >
                {content.finalCta.primaryCtaLabel}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                href={content.finalCta.secondaryCtaHref}
                iconStart={<Icon name="discover-circle" size="md" decorative />}
              >
                {content.finalCta.secondaryCtaLabel}
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
