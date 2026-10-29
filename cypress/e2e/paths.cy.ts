/// <reference types="cypress" />

describe('HUMAN.exe — All 8 Decision Paths (2 × 2 × 2 Matrix)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
    cy.visit('/');
  });

  // Load the 8 paths from fixtures
  const paths = [
    {
      pathId: 'PATH-1',
      description: 'Tamamen Güvenli Yol (All Safe)',
      choices: ['D1_VERIFY_SCHEMA', 'D2_SMOKE_TEST', 'D3_REDACT_RESTRICT'],
      expectedFlags: [],
      expectedEnding: 'SAFE_RECOVERY',
    },
    {
      pathId: 'PATH-2',
      description: 'Yalnızca Gizlilik Riski (Privacy Risk Only)',
      choices: ['D1_VERIFY_SCHEMA', 'D2_SMOKE_TEST', 'D3_SHARE_RAW'],
      expectedFlags: ['PRIVACY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-3',
      description: 'Yalnızca Doğrulama Riski (Verify Risk Only)',
      choices: ['D1_VERIFY_SCHEMA', 'D2_DEPLOY_NOW', 'D3_REDACT_RESTRICT'],
      expectedFlags: ['VERIFY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-4',
      description: 'Doğrulama ve Gizlilik Riski (Verify + Privacy Risk)',
      choices: ['D1_VERIFY_SCHEMA', 'D2_DEPLOY_NOW', 'D3_SHARE_RAW'],
      expectedFlags: ['VERIFY_RISK', 'PRIVACY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-5',
      description: 'Yalnızca Mimari Risk (Arch Risk Only)',
      choices: ['D1_ROLLBACK_NOW', 'D2_SMOKE_TEST', 'D3_REDACT_RESTRICT'],
      expectedFlags: ['ARCH_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-6',
      description: 'Mimari ve Gizlilik Riski (Arch + Privacy Risk)',
      choices: ['D1_ROLLBACK_NOW', 'D2_SMOKE_TEST', 'D3_SHARE_RAW'],
      expectedFlags: ['ARCH_RISK', 'PRIVACY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-7',
      description: 'Mimari ve Doğrulama Riski (Arch + Verify Risk)',
      choices: ['D1_ROLLBACK_NOW', 'D2_DEPLOY_NOW', 'D3_REDACT_RESTRICT'],
      expectedFlags: ['ARCH_RISK', 'VERIFY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
    {
      pathId: 'PATH-8',
      description: 'Tüm Riskler (All 3 Risks Incurred)',
      choices: ['D1_ROLLBACK_NOW', 'D2_DEPLOY_NOW', 'D3_SHARE_RAW'],
      expectedFlags: ['ARCH_RISK', 'VERIFY_RISK', 'PRIVACY_RISK'],
      expectedEnding: 'UNSAFE_RECOVERY',
    },
  ];

  paths.forEach((p) => {
    it(`should execute ${p.pathId} (${p.description}) reaching ${p.expectedEnding}`, () => {
      // 1. Complete onboarding
      cy.completeOnboarding('intermediate', 'developer', 'risk');

      // 2. Decision D1
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(p.choices[0], 0);

      // 3. Decision D2
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(p.choices[1], 1);

      // 4. Decision D3
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(p.choices[2], 0);

      // 5. Final Report Verification
      cy.get('[data-cy="report-window"]').should('be.visible');
      cy.get('[data-cy="ending"]').should('contain.text', p.expectedEnding);

      // Verify exact flag set
      const allFlags = ['ARCH_RISK', 'VERIFY_RISK', 'PRIVACY_RISK'];
      allFlags.forEach((flag) => {
        if (p.expectedFlags.includes(flag)) {
          cy.get(`[data-cy="flag-${flag}"]`).should('be.visible');
        } else {
          cy.get(`[data-cy="flag-${flag}"]`).should('not.exist');
        }
      });

      // 6. Restart Session
      cy.get('[data-cy="restart-btn"]').click();
      cy.get('[data-cy="onboarding-window"]').should('be.visible');
      cy.get('[data-cy="start-session-btn"]').should('be.disabled');
    });
  });
});
