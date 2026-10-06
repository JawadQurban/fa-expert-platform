import { describe, expect, it } from 'vitest';
import { EXPERT_HUB_MODULES, deploymentProblems } from './expertHubConfig';

const wired = {
  apiBaseUrl: 'https://uat.example/api',
  liveModules: EXPERT_HUB_MODULES.filter((module) => module !== 'identity'),
  authMode: 'academy-sso',
};

describe('deploymentProblems — no silent mocks outside development/test', () => {
  it('allows demo data and the placeholder sign-in in development and test', () => {
    for (const environment of ['development', 'test']) {
      expect(
        deploymentProblems({ environment, apiBaseUrl: '', liveModules: [], authMode: 'dev-sso' })
      ).toEqual([]);
    }
  });

  it('accepts a fully wired UAT (identity fails closed on its own)', () => {
    expect(deploymentProblems({ environment: 'uat', ...wired })).toEqual([]);
  });

  it('refuses UAT/production with no API, the placeholder sign-in, or modules on demo data', () => {
    const empty = deploymentProblems({
      environment: 'production',
      apiBaseUrl: '',
      liveModules: [],
      authMode: 'dev-sso',
    });
    expect(empty).toHaveLength(2);
    expect(empty[0]).toContain('EXPERT_HUB_API_BASE_URL');
    expect(empty[1]).toContain('EXPERT_HUB_OIDC_CLIENT_ID');

    const partial = deploymentProblems({
      environment: 'uat',
      ...wired,
      liveModules: wired.liveModules.filter((module) => module !== 'withdrawal'),
    });
    expect(partial).toEqual([
      'EXPERT_HUB_DATA_MODE leaves these modules on demo data: withdrawal.',
    ]);
  });

  it('treats an unknown environment label as strict', () => {
    expect(
      deploymentProblems({
        environment: 'staging',
        apiBaseUrl: '',
        liveModules: [],
        authMode: 'dev-sso',
      })
    ).not.toEqual([]);
  });
});
