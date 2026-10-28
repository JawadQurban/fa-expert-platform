import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApplicationFieldOption, ApplicationOptionsSource } from './applicationForm.types';
import { APPLICATIONS_API_VERSION } from './applicationsService';

/**
 * Options the application form fetches when it renders (`optionsSource`) —
 * today, FAST's published programmes for «أبرز البرامج التدريبية…»
 * (BUG-004, `P-386`).
 *
 * `available: false` means the list cannot be had right now (FAST is not
 * configured here, or did not answer). The field then still works: its static
 * options («أخرى») and the free text beside them — submission is never
 * blocked on FAST.
 */
export interface RuntimeOptionsDto {
  readonly available: boolean;
  readonly items: readonly ApplicationFieldOption[];
}

export interface FormOptionsService {
  listOptions(
    source: ApplicationOptionsSource
  ): Promise<Result<RuntimeOptionsDto, ExpertHubApiError>>;
}

const PATHS: Readonly<Record<ApplicationOptionsSource, string>> = {
  'fast-programmes': `${APPLICATIONS_API_VERSION}/applications/form-options/fast-programmes`,
};

export function createHttpFormOptionsProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): FormOptionsService {
  return {
    listOptions: (source) => client.get<RuntimeOptionsDto>(PATHS[source]),
  };
}

/** Demo stand-in: three Academy programmes, as the API would serve them. */
export function createMockFormOptionsProvider(): FormOptionsService {
  const programmes: readonly ApplicationFieldOption[] = [
    {
      value: 'fast:7c1f9a2b-0000-4000-8000-0000000000b2',
      labelAr: 'برنامج القيادة المالية',
      labelEn: 'Financial Leadership',
    },
    {
      value: 'fast:7c1f9a2b-0000-4000-8000-0000000000b3',
      labelAr: 'برنامج إدارة المخاطر',
      labelEn: 'Risk Management',
    },
    {
      value: 'fast:7c1f9a2b-0000-4000-8000-0000000000b4',
      labelAr: 'برنامج مكافحة غسل الأموال',
      labelEn: 'Anti-Money Laundering',
    },
  ];
  return {
    listOptions: () => Promise.resolve({ ok: true, value: { available: true, items: programmes } }),
  };
}

let instance: FormOptionsService | null = null;

export function getFormOptionsService(): FormOptionsService {
  instance ??= isModuleLive('applications')
    ? createHttpFormOptionsProvider()
    : createMockFormOptionsProvider();
  return instance;
}

/** Test seam (pass `null` to restore the default). */
export function setFormOptionsServiceForTesting(service: FormOptionsService | null): void {
  instance = service;
}
