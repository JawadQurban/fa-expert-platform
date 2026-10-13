import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loading } from '@ds/composite';
import { Button } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { getNominationService } from './applicationsService';
import { getNewApplicationContent } from './newApplication.content';
import NewApplicationPage, { type Nominee } from './NewApplicationPage';

/**
 * **EH-INT-12 — J-02**, step 2: the application form, filled for the user named
 * in the URL. The user is re-read by id, so a reload or a shared link opens the
 * same person — and a stale or foreign id says so instead of opening a form.
 */
export default function NominationFormPage() {
  const { userId = '' } = useParams();
  const { locale } = useLocale();
  const content = useMemo(() => getNewApplicationContent(locale), [locale]);
  const [nominee, setNominee] = useState<Nominee | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setMissing(false);
    void getNominationService()
      .searchCandidates(userId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          setError(response.error);
          return;
        }
        const match = response.value.find((c) => c.userId === userId);
        if (match == null) {
          setMissing(true);
          return;
        }
        setNominee({
          userId: match.userId,
          name: locale === 'en' && match.fullNameEn !== '' ? match.fullNameEn : match.fullNameAr,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, locale, reloadKey]);

  if (missing) {
    return (
      <PageLoadError
        title={content.nomination.search.notFoundTitle}
        body={content.nomination.search.notFoundBody}
        retryLabel={content.actions.retry}
        action={
          <Button variant="primary" size="md" href={expertHubPaths.internalNominations}>
            {content.nomination.backToSearch}
          </Button>
        }
        size="prose"
      />
    );
  }
  if (error != null) {
    const failure = describeLoadFailure(error, locale, {
      title: content.errors.loadFailedTitle,
      body: content.errors.loadFailedBody,
    });
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.actions.retry}
        size="prose"
      />
    );
  }
  if (nominee == null) {
    return <Loading variant="skeleton" lines={6} label={content.nomination.title} />;
  }
  // Keyed by the user, so moving to another nominee starts a fresh form.
  return <NewApplicationPage key={nominee.userId} nominee={nominee} />;
}
