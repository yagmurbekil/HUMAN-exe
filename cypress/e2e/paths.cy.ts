/// <reference types="cypress" />
import paths from '../fixtures/paths.json';

describe('HUMAN.exe — All 8 Decision Paths (2 × 2 × 2 Matrix)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
    cy.visit('/');
  });

  // The 8 paths come from the shared fixture also used by rules.cy.ts (AC-14)
  paths.forEach((p) => {
    it(`should execute ${p.pathId} (${p.description}) reaching ${p.expectedEnding}`, () => {
      const [c1, c2, c3] = p.decisions.map((d) => d.choice);
      const [clock1, clock2, clock3] = p.expectedClocks;

      // 1. Complete onboarding
      cy.completeOnboarding('intermediate', 'developer', 'risk');
      cy.get('[data-cy="simulated-clock"]').should('have.text', '08:00');

      // 2. Decision D1
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(c1, 0, clock1);

      // 3. Decision D2
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(c2, 1, clock2);

      // 4. Decision D3
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.makeDecisionAndJustify(c3, 0, clock3);

      // 5. Final Report Verification
      cy.get('[data-cy="report-window"]').should('be.visible');
      cy.get('[data-cy="ending"]').should('contain.text', p.expectedEnding);
      cy.get('[data-cy="ending"]').should('contain.text', `Simüle Bitiş Saati: ${clock3}`);

      // Verify exact flag set
      const allFlags = ['ARCH_RISK', 'VERIFY_RISK', 'PRIVACY_RISK'];
      allFlags.forEach((flag) => {
        if (p.expectedFlags.includes(flag)) {
          cy.get(`[data-cy="flag-${flag}"]`).should('be.visible');
        } else {
          cy.get(`[data-cy="flag-${flag}"]`).should('not.exist');
        }
      });

      // 6. Restart Session (requires confirmation)
      cy.get('[data-cy="restart-btn"]').click();
      cy.confirmRestart();
      cy.get('[data-cy="onboarding-window"]').should('be.visible');
      cy.get('[data-cy="start-session-btn"]').should('be.disabled');
      cy.get('[data-cy="simulated-clock"]').should('have.text', '08:00');
    });
  });
});
