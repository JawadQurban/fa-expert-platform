import { useEffect, useState } from 'react';
import { Modal } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../../app/router/paths';
import { getProfileService } from '../../profile/profileService';
import { getHomeContent } from '../home.content';
import styles from './CompleteProfilePrompt.module.css';

/** Per-browser, per-session: asked once, not on every navigation. */
const DISMISSED_KEY = 'eh.completeProfilePrompt.dismissed';

/**
 * Asks somebody the Academy recognises as a trainer to complete the data
 * Expert Hub still needs.
 *
 * ⚠️ **Only for a trainer who came from FAST** — owner ruling, 2026-09-10:
 * «it should pop up to complete the data when it logs in, this only for the
 * trainer come from the FAST». The population is exactly
 * `establishedInExpertHub === false`: the role was granted from the Academy's
 * own record (`P-234`) and this platform's accreditation never happened. An
 * accredited trainer already has a file and is never asked.
 *
 * ⚠️ **Asked once per session, and dismissible.** A prompt that reappears on
 * every navigation stops being a prompt and becomes an obstacle — and the
 * person may have signed in to do something else entirely. `sessionStorage`
 * rather than `localStorage` on purpose: «not now» means this visit, not
 * forever, and their data really is incomplete.
 */
export function CompleteProfilePrompt() {
  const { locale } = useLocale();
  const content = getHomeContent(locale).completeProfile;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // ⚠️ Never throws: a browser with site data blocked must still render the
    // page, and the cost of the read failing is at worst one extra prompt.
    const dismissed = (() => {
      try {
        return sessionStorage.getItem(DISMISSED_KEY) === '1';
      } catch {
        return false;
      }
    })();
    if (dismissed) {
      return () => {
        cancelled = true;
      };
    }

    void getProfileService()
      .getMyProfile()
      .then((result) => {
        if (cancelled || !result.ok) {
          return;
        }
        setOpen(!result.value.establishedInExpertHub);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage unavailable — the prompt simply shows again next load.
    }
  };

  return (
    <Modal open={open} onClose={close} title={content.title}>
      <div className={styles.body}>
        <Typography as="p" variant="text-sm">
          {content.body}
        </Typography>

        <Typography as="p" variant="text-sm" color="muted">
          {content.fromAcademy}
        </Typography>

        <div className={styles.actions}>
          <Button variant="primary" href={expertHubPaths.profile}>
            {content.complete}
          </Button>
          <Button variant="tertiary" onClick={close}>
            {content.later}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
