import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from '@ds/primitives/Link';
import { Button } from '@ds/primitives/Button';
import { Avatar } from '@ds/primitives';
import { ButtonMenu, Menu, MenuListItem, MenuSection } from '@ds/composite';
import { Header } from '@ds/shell';
import type { HeaderNavItem } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { useMediaQuery } from '@hooks/useMediaQuery';
import type { ExpertHubSession } from '../../app/auth/types';
// Official header action icons supplied in the repository (`src/assets/icons`),
// matching the reference screenshot. They use `fill="currentColor"`, so they
// inherit each Button's text color. Inlined the same trusted, build-time-bundled
// `?raw` way the footer renders its brand icons (they are not DGA icon-sheet
// exports, so they live outside the generated `Icon` registry).
import searchIconRaw from '@/assets/icons/search-01-stroke.svg?raw';
import translationIconRaw from '@/assets/icons/translation-stroke.svg?raw';
import userIconRaw from '@/assets/icons/user-stroke.svg?raw';
import { expertHubPaths } from '../../app/router/paths';
import { useExpertHubAuth } from '../../app/auth/AuthProvider';
import { expertHubBranding } from '../content/branding';
import {
  getHeaderContent,
  type HeaderContent,
  type HeaderNavLink,
} from '../content/header.content';
import type { ExpertHubHeaderVariant } from './ExpertHubHeader';
import styles from './ExpertHubHeader.module.css';

/** Renders an official repo SVG as a decorative, button-sized action icon. */
function actionIcon(svg: string) {
  return (
    <span
      className={styles.actionIcon}
      aria-hidden="true"
      // Trusted, build-time-bundled asset markup (never user input) — the same
      // technique the shared footer uses for its brand icons.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Level 3 of the Expert Hub header — the main navigation header, and the single
 * `banner` landmark for the whole header. An application-level composition of the
 * approved Design System `Header` shell component (its built-in responsive toggle
 * is reused, not reinvented); no Design System component is created or modified.
 *
 * Branding sits on the leading (right, RTL) side; the primary navigation and the
 * action cluster (search → language switcher → Apply → **Login**, the green
 * primary) follow. Navigation switches by shell variant: the public marketing IA
 * for `public`, and role-scoped navigation once authenticated (`portal` /
 * `internal`) — so trainer/internal destinations are never exposed pre-auth.
 *
 * The Login action routes through the Expert Hub authentication abstraction
 * (Login page → dev-SSO placeholder → return URL); it is never a credential form.
 * All copy/targets come from `header.content.ts`.
 */

/** A nav item is active when its path is the current path (or a parent of it). */
function isActive(href: string, pathname: string): boolean {
  if (href === expertHubPaths.landing) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Marks the current tab — <b>the most specific match, and only that one</b>.
 *
 * ⚠️ Prefix matching alone lit two tabs at once (`D-23`): the internal
 * dashboard lives at `/internal`, so every `/internal/...` page matched it as
 * well as its own tab, and «لوحة العمل» stayed highlighted on the inbox, the
 * assignment requests and the trainer base.
 *
 * Exact matching would fix that and break something worse — a detail page like
 * `/applications/{id}` would light no tab at all, leaving a person with no idea
 * where they are. So both matches are computed and the longest href wins, which
 * is the one that actually describes the page.
 */
function toNavItems(links: readonly HeaderNavLink[], pathname: string): HeaderNavItem[] {
  const matched = links.filter((link) => isActive(link.href, pathname));
  const mostSpecific = matched.reduce(
    (longest, link) => (link.href.length > longest.length ? link.href : longest),
    ''
  );
  return links.map((link) => ({
    id: link.id,
    label: link.label,
    href: link.href,
    external: link.external,
    selected: link.href === mostSpecific,
  }));
}

/**
 * What somebody holding only the baseline `individual` role can reach.
 *
 * ⚠️ Owner ruling, 2026-09-08: «the individual can only see the two tabs, which
 * is the main page and my request, but the trainer is already [an] approved
 * trainer so it can see everything.» Engagements, materials, entitlements and
 * the trainer file all belong to a trainer — offering them to somebody who is
 * not one promises a standing they do not have, and every one of those pages
 * would be empty. Their application is the one thing they do have.
 */
const INDIVIDUAL_AREAS: readonly string[] = ['home', 'applications'];

/**
 * What this person can actually reach — one derivation, so the tabs and the
 * account menu can never offer different sets.
 */
function visibleLinks(
  variant: ExpertHubHeaderVariant,
  content: HeaderContent,
  isTrainer: boolean
): readonly HeaderNavLink[] {
  const links =
    variant === 'portal'
      ? content.portalNav
      : variant === 'internal'
        ? content.internalNav
        : content.publicNav;
  return variant === 'portal' && !isTrainer
    ? links.filter((link) => INDIVIDUAL_AREAS.includes(link.id))
    : links;
}

function navForVariant(
  variant: ExpertHubHeaderVariant,
  content: HeaderContent,
  pathname: string,
  isTrainer: boolean
): HeaderNavItem[] {
  return toNavItems(visibleLinks(variant, content, isTrainer), pathname);
}

/**
 * The signed-in person's own corner of the header: their avatar, and a menu of
 * the places that belong to them.
 *
 * ⚠️ <b>The menu lists only what this person can actually reach.</b> It is
 * built from the same filtered navigation set the header renders, so somebody
 * holding only the baseline `individual` role is not offered their trainer file
 * from here while the tab for it is deliberately hidden. A menu that offers a
 * door the guard will close is worse than no menu.
 *
 * The avatar carries initials, not a photograph: `G26` leaves photo upload
 * blocked, and `Avatar` renders initials when it has no source — which is the
 * same thing the design system's own kit shows.
 */
function AccountMenu({
  session,
  content,
  links,
  onLogout,
}: {
  readonly session: ExpertHubSession;
  readonly content: HeaderContent;
  readonly links: readonly HeaderNavLink[];
  readonly onLogout: () => void;
}) {
  const navigate = useNavigate();

  return (
    <ButtonMenu
      variant="subtle"
      size="md"
      aria-label={content.accountLabel}
      icon={<Avatar name={session.displayName} size="sm" decorative />}
      menu={
        <Menu>
          {/* The person's own name, as the menu's heading — a menu of «my»
              things should say whose. */}
          <MenuSection label={<span dir="auto">{session.displayName}</span>}>
            {links.map((link) => (
              <MenuListItem
                key={link.id}
                // `void`: navigate returns a promise, and an unhandled one on a
                // DOM attribute is a lint error and a real footgun.
                onClick={() => {
                  void navigate(link.href);
                }}
              >
                {link.label}
              </MenuListItem>
            ))}
            <MenuListItem onClick={onLogout}>{content.logoutLabel}</MenuListItem>
          </MenuSection>
        </Menu>
      }
    />
  );
}

export function ExpertHubMainHeader({ variant }: { readonly variant: ExpertHubHeaderVariant }) {
  const { locale, toggleLocale } = useLocale();
  const { session, hasRole, logout } = useExpertHubAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const content = getHeaderContent(locale);

  /*
    The account menu offers the person's own places — everything they can reach
    except the home tab, which is one click away in the navigation beside it.
    Built from the same filtered set, so the menu can never offer a door the
    route guard will close.
  */
  const accountLinks = visibleLinks(variant, content, hasRole('trainer')).filter(
    (link) => link.id !== 'home' && link.id !== 'dashboard'
  );

  const localeToggle = (
    <Button
      variant="tertiary"
      size="sm"
      onClick={toggleLocale}
      iconStart={actionIcon(translationIconRaw)}
    >
      {content.localeToggleLabel}
    </Button>
  );

  const handleLogout = () => {
    void logout().then(() => navigate(expertHubPaths.landing, { replace: true }));
  };

  /*
    The internal shell carries ten areas — too many for one clean tab row, so it
    wrapped into several rows. Keep the primary six inline and fold the rest into
    a "More" menu, so the header stays one row and every destination is still
    reachable (the account menu already lists the person's own places too).
  */
  const allNav = navForVariant(variant, content, pathname, hasRole('trainer'));
  /*
    ⚠️ Measured, not guessed: with six Arabic tabs the row wrapped to TWO rows
    from 1100px to 1366px and THREE at 1024px — a 216px-tall header on a laptop.
    Four tabs keep it to one row there; the full six only fit from 1440px up.
    The rest are always reachable in the "More" menu either way.
  */
  const isNarrowHeader = useMediaQuery('(max-width: 89.98rem)');
  const isTightHeader = useMediaQuery('(max-width: 74.98rem)');
  const isVeryTightHeader = useMediaQuery('(max-width: 66.98rem)');
  const PRIMARY_TAB_COUNT = isVeryTightHeader ? 2 : isTightHeader ? 3 : isNarrowHeader ? 4 : 6;
  const showOverflow = variant === 'internal' && allNav.length > PRIMARY_TAB_COUNT;
  const primaryNav = showOverflow ? allNav.slice(0, PRIMARY_TAB_COUNT) : allNav;
  const overflowNav = showOverflow ? allNav.slice(PRIMARY_TAB_COUNT) : [];
  const overflowMenu = overflowNav.length > 0 && (
    <ButtonMenu
      variant="tertiary"
      size="md"
      menu={
        <Menu>
          <MenuSection label={content.moreLabel}>
            {overflowNav.map((item) => (
              <MenuListItem
                key={item.id}
                onClick={() => {
                  void navigate(item.href);
                }}
              >
                {item.label}
              </MenuListItem>
            ))}
          </MenuSection>
        </Menu>
      }
    >
      {content.moreLabel}
    </ButtonMenu>
  );

  const actions =
    variant === 'public' ? (
      <div className={styles.actions}>
        <Button
          variant="tertiary"
          size="sm"
          href={expertHubPaths.directory}
          iconStart={actionIcon(searchIconRaw)}
        >
          {content.searchLabel}
        </Button>
        {localeToggle}
        {session == null ? (
          <>
            <Button variant="secondary" size="sm" href={expertHubPaths.applicationsNew}>
              {content.applyLabel}
            </Button>
            {/* No `returnUrl`: a login action in the header does not know *who*
                is about to sign in, so it must not presume a destination. The
                login page decides where to land. A guard redirect still carries
                the path the user actually attempted — that is real intent and
                is honoured. */}
            <Button
              variant="primary"
              size="sm"
              href={expertHubPaths.login}
              iconStart={actionIcon(userIconRaw)}
            >
              {content.loginLabel}
            </Button>
          </>
        ) : (
          /* Signed in, on a public page. Offering "log in" to someone who
             already is reads as a broken session, and it is the one thing the
             header can be certain about. The name links to their own area,
             which `ResolveHomeByRole` picks — the public pages do not know
             whether this is a trainer or staff, and must not guess. */
          <>
            <Link href={expertHubPaths.home} className={styles.account}>
              <span dir="auto">{session.displayName}</span>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              {content.logoutLabel}
            </Button>
          </>
        )}
      </div>
    ) : (
      <div className={styles.actions}>
        {overflowMenu}
        {localeToggle}
        {session != null && (
          <AccountMenu
            session={session}
            content={content}
            links={accountLinks}
            onLogout={handleLogout}
          />
        )}
      </div>
    );

  return (
    <Header
      logo={
        // TODO(branding): if a dedicated Expert Hub brand icon SVG is provided,
        // swap `expertHubBranding.logoSrc` for it here (keep it beside the product
        // name below) — do not reinterpret/simplify the official mark.
        <img
          className={styles.logo}
          src={expertHubBranding.logoSrc}
          alt={expertHubBranding.organizationName}
        />
      }
      logoLabel={<span className={styles.brandName}>{content.brandName}</span>}
      logoHref={expertHubBranding.homeHref}
      logoLinkLabel={content.logoLinkLabel}
      nav={primaryNav}
      navLabel={content.navLabel}
      menuLabel={content.menuLabel}
      actions={actions}
    />
  );
}
