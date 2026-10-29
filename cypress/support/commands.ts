/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      completeOnboarding(level?: string, role?: string, goal?: string): Chainable<void>;
      makeDecisionAndJustify(choiceId: string, justifyIndex?: number): Chainable<void>;
      stubTutorApi(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('stubTutorApi', () => {
  cy.intercept('GET', '/api/health', {
    statusCode: 200,
    body: { status: 'ok', hasKey: true, model: 'gemini-3.8-flash' },
  }).as('healthCheck');

  cy.intercept('POST', '/api/tutor', {
    statusCode: 200,
    body: {
      text: 'Mevcut kanıt kartlarını incelediğinizde sistemin bütünlüğünü koruyacak adımı nasıl belirlersiniz?',
      isGuardTriggered: false,
      mode: 'live',
    },
  }).as('tutorResponse');
});

Cypress.Commands.add('completeOnboarding', (level = 'intermediate', role = 'developer', goal = 'risk') => {
  cy.get(`[data-cy="level-${level}"]`).click();
  cy.get(`[data-cy="role-${role}"]`).click();
  cy.get(`[data-cy="goal-${goal}"]`).click();
  cy.get('[data-cy="start-session-btn"]').should('not.be.disabled').click();
});

Cypress.Commands.add('makeDecisionAndJustify', (choiceId: string, justifyIndex = 0) => {
  cy.get(`[data-cy="choice-${choiceId}"]`).click();
  cy.get('[data-cy="confirm-decision-btn"]').should('not.be.disabled').click();

  // Justify modal
  cy.get('[data-cy="justify-dlg"]').should('be.visible');
  cy.get(`[data-cy="justification-option-${justifyIndex}"]`).click();
  cy.get('[data-cy="justify-confirm-btn"]').should('not.be.disabled').click();

  // Consequence screen
  cy.get('[data-cy="consequence-window"]').should('be.visible');
  cy.get('[data-cy="continue-btn"]').click();
});

export {};
