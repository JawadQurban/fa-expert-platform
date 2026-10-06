import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockNotificationProvider } from './mockNotificationProvider';
import type {
  NotificationLogDto,
  NotificationLogQuery,
  NotificationMatrixDto,
  RouteEventInput,
  SlaInput,
  SlaMatrixRowDto,
  TemplateInput,
} from './notification.types';

/**
 * Expert Hub notification service — **CAP-07** (`BRD-TRN-001` §8.7), the System
 * Administrator's four screens.
 *
 * **What this interface cannot do is again the specification.**
 *
 * - **It cannot send a notification.** §8.7.4's `F-0701` is the *recipient's*
 *   feature and `BR-0703` has each capability raise its own event; CAP-07
 *   decides recipient, template and channel. Nothing here triggers a send, so
 *   no screen can become a way to message people.
 * - **It cannot create an event.** The catalogue belongs to the capabilities
 *   that raise the events (`BR-0703`).
 * - **It cannot write a message body anywhere except a template.** `BR-0701`
 *   forbids free-form wording in any system notification, so `routeEvent` takes
 *   a template id and never text.
 * - **It cannot choose a channel.** `BR-0702` fires email and in-platform
 *   together; there is no per-channel input on any operation.
 * - **It cannot edit or delete a log entry.** The log records what happened.
 *
 * ⚠️ **There is no resend operation**, and its absence is a decision rather than
 * an omission. `US-0705` wants the failed notifications «أتابعها وأعالجها» —
 * followed up and handled — but §8.7 never defines what a resend does: whether
 * it re-renders at the template's *current* version or the sent one, whether it
 * writes a second log row, whether it re-resolves the recipient's language.
 * Those are business answers, and guessing them would bake one in. The log
 * therefore surfaces every failure with its reason and the screen says the
 * resend is not available in this release. → `Q32`.
 */

export const NOTIFICATION_API_VERSION = 'v1';

export interface NotificationService {
  /** `F-0702` — the matrix: every event, its routing, and the template list. */
  getMatrix(): Promise<Result<NotificationMatrixDto, ExpertHubApiError>>;
  /**
   * `F-0702` — route one event. Takes a **template id**, never text
   * (`BR-0701`), and no channel (`BR-0702`). The server refuses a draft
   * template, so a routed row always points at an approved one.
   */
  routeEvent(
    eventCode: string,
    input: RouteEventInput
  ): Promise<Result<NotificationMatrixDto, ExpertHubApiError>>;
  /** `F-0702` — pause a routed row. An unrouted row has nothing to pause. */
  setRowActive(
    eventCode: string,
    isActive: boolean
  ): Promise<Result<NotificationMatrixDto, ExpertHubApiError>>;

  /** `F-0703` — both languages together (`BR-0701`); System Administrator only (`BR-0704`). */
  saveTemplate(
    templateId: string | null,
    input: TemplateInput
  ): Promise<Result<NotificationMatrixDto, ExpertHubApiError>>;
  /** `F-0703` — approval is what makes a template routable, and it is separate from saving. */
  approveTemplate(templateId: string): Promise<Result<NotificationMatrixDto, ExpertHubApiError>>;

  /** `F-0704` — every deadline across the twelve capabilities (`BR-0705`). */
  listSlaRows(): Promise<Result<readonly SlaMatrixRowDto[], ExpertHubApiError>>;
  /**
   * `F-0704` — set or change one deadline. **The only place a deadline is
   * edited** (`BR-0705`): no other capability's service exposes one.
   */
  setSla(
    slaId: string,
    input: SlaInput
  ): Promise<Result<readonly SlaMatrixRowDto[], ExpertHubApiError>>;

  /** `F-0705` — read-only; see the module note on the absent resend. */
  listLog(
    query: NotificationLogQuery
  ): Promise<Result<readonly NotificationLogDto[], ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpNotificationProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): NotificationService {
  const base = `${NOTIFICATION_API_VERSION}/internal/notifications`;
  return {
    getMatrix() {
      return client.get<NotificationMatrixDto>(`${base}/matrix`);
    },
    routeEvent(eventCode, input) {
      return client.post<NotificationMatrixDto>(
        `${base}/matrix/${encodeURIComponent(eventCode)}/routing`,
        input
      );
    },
    setRowActive(eventCode, isActive) {
      return client.post<NotificationMatrixDto>(
        `${base}/matrix/${encodeURIComponent(eventCode)}/active`,
        { isActive }
      );
    },
    saveTemplate(templateId, input) {
      return templateId == null
        ? client.post<NotificationMatrixDto>(`${base}/templates`, input)
        : client.post<NotificationMatrixDto>(
            `${base}/templates/${encodeURIComponent(templateId)}`,
            input
          );
    },
    approveTemplate(templateId) {
      return client.post<NotificationMatrixDto>(
        `${base}/templates/${encodeURIComponent(templateId)}/approve`
      );
    },
    listSlaRows() {
      // Not under `/notifications`: a deadline is not a notification, even
      // though §8.7 puts both capabilities' screens in the same hands.
      return client.get<readonly SlaMatrixRowDto[]>(`${NOTIFICATION_API_VERSION}/internal/sla`);
    },
    setSla(slaId, input) {
      return client.post<readonly SlaMatrixRowDto[]>(
        `${NOTIFICATION_API_VERSION}/internal/sla/${encodeURIComponent(slaId)}`,
        input
      );
    },
    listLog(query) {
      const params = new URLSearchParams();
      if (query.search.trim() !== '') {
        params.set('q', query.search.trim());
      }
      if (query.sendStatus != null) {
        params.set('status', query.sendStatus);
      }
      if (query.channel != null) {
        params.set('channel', query.channel);
      }
      const suffix = params.toString() === '' ? '' : `?${params.toString()}`;
      return client.get<readonly NotificationLogDto[]>(`${base}/log${suffix}`);
    },
  };
}

function createDefaultService(): NotificationService {
  return isModuleLive('notifications')
    ? createHttpNotificationProvider()
    : createMockNotificationProvider();
}

let serviceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setNotificationServiceForTesting(service: NotificationService | null): void {
  serviceInstance = service;
}
