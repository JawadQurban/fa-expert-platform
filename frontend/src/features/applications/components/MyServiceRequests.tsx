import { useEffect, useState } from 'react';
import { Alert, Card } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { formatDate } from '../../../shared/formatting';
import { getApplicationsService } from '../applicationsService';
import type { MyServiceRequestDto, MyServiceRequestsDto } from '../addService.types';
import type { MyApplicationsContent } from '../myApplications.content';
import styles from './MyServiceRequests.module.css';

const STATUS_TONE: Readonly<Record<MyServiceRequestDto['status'], TagVariant>> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

/**
 * BUG-019 / BUG-021 — «طلبات إضافة الخدمة» on My Applications. A submitted
 * add-service request used to vanish (nothing listed its number or outcome),
 * and the only way in was buried inside an approved application. This section
 * gives both: the entry point at the top level, and every request with its own
 * `EH-ASR-…` number and status. It renders nothing for somebody with no
 * approved application and no requests — there is nothing to say to them.
 */
export function MyServiceRequests({
  content,
  locale,
}: {
  readonly content: MyApplicationsContent;
  readonly locale: Locale;
}) {
  const copy = content.serviceRequests;
  const [data, setData] = useState<MyServiceRequestsDto | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getApplicationsService()
      .listMyServiceRequests()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setData(result.value);
        } else {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <Alert tone="warning" role="status" className={styles.section}>
        {copy.loadFailed}
      </Alert>
    );
  }
  if (data == null || (data.addServiceApplicationId == null && data.items.length === 0)) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="eh-service-requests-title">
      <div className={styles.head}>
        <div className={styles.headText}>
          <Typography as="h2" id="eh-service-requests-title" variant="text-lg" weight="bold">
            {copy.heading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {copy.lead}
          </Typography>
        </div>
        {data.addServiceApplicationId != null && (
          <Button
            variant="secondary"
            size="md"
            href={expertHubPaths.applicationAddService(data.addServiceApplicationId)}
            iconStart={<Icon name="add-circle" size="md" decorative />}
          >
            {copy.addService}
          </Button>
        )}
      </div>

      {data.items.length === 0 ? (
        <Typography as="p" variant="text-md" color="muted">
          {copy.empty}
        </Typography>
      ) : (
        <ul className={styles.list} aria-label={copy.listLabel}>
          {data.items.map((request) => (
            <li key={request.id}>
              <Card effect="stroke" className={styles.item}>
                <div className={styles.itemMain}>
                  <Typography as="p" variant="text-md" weight="bold">
                    {content.services[request.requestedService]}
                  </Typography>
                  <Typography as="p" variant="text-sm" color="muted">
                    <bdi>{request.reference}</bdi>
                    {' · '}
                    {copy.submittedAt(formatDate(request.submittedAt, locale))}
                  </Typography>
                  {request.rejectionReason === 'no-active-agreement' && (
                    <Typography as="p" variant="text-sm">
                      {copy.noAgreement}
                    </Typography>
                  )}
                </div>
                <Tag variant={STATUS_TONE[request.status]} size="sm">
                  {copy.statuses[request.status]}
                </Tag>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
