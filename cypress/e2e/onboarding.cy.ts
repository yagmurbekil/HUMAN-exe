/// <reference types="cypress" />

describe('HUMAN.exe — Onboarding & Profile Setup (AE1)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
    cy.visit('/');
  });

  it('keeps Start Session button disabled until all 3 questions are answered', () => {
    cy.get('[data-cy="onboarding-window"]').should('be.visible');
    cy.get('[data-cy="start-session-btn"]').should('be.disabled');

    // Select only level
    cy.get('[data-cy="level-beginner"]').click();
    cy.get('[data-cy="start-session-btn"]').should('be.disabled');

    // Select only role
    cy.get('[data-cy="role-qa"]').click();
    cy.get('[data-cy="start-session-btn"]').should('be.disabled');

    // Select goal -> now complete
    cy.get('[data-cy="goal-privacy"]').click();
    cy.get('[data-cy="start-session-btn"]').should('not.be.disabled');

    // Click start
    cy.get('[data-cy="start-session-btn"]').click();

    // Verify D1 decision window opened with correct profile badge
    cy.get('[data-cy="decision-window"]').should('be.visible');
    cy.get('[data-cy="profile-badge"]').should('contain.text', 'Başlangıç · QA · Gizlilik');
  });

  it('applies role-based card pinning on D1', () => {
    // QA role should pin RELEASE_NOTES first
    cy.get('[data-cy="level-intermediate"]').click();
    cy.get('[data-cy="role-qa"]').click();
    cy.get('[data-cy="goal-validation"]').click();
    cy.get('[data-cy="start-session-btn"]').click();

    // Check first tab has SABİTLENDİ
    cy.get('.win95-tab').first().should('contain.text', 'RELEASE_NOTES');
  });
});
