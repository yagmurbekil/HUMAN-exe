/// <reference types="cypress" />

describe('HUMAN.exe — Socratic Tutor E2E & Stubbing (AE5, AC-13)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
    cy.visit('/');
    cy.completeOnboarding('intermediate', 'qa', 'validation');
  });

  it('opens tutor window, steps through hint ladder, and receives stubbed response', () => {
    cy.get('[data-cy="tutor-btn"]').click();
    cy.get('[data-cy="tutor-window"]').should('be.visible');

    // Hint ladder button
    cy.get('[data-cy="hint-btn"]').click();
    cy.get('[data-cy="tutor-output"]').should('contain.text', '[İPUCU BASAMAĞI 1/2]');

    // Send a message
    cy.get('[data-cy="tutor-input"]').type('Birim testleri yeterli mi?');
    cy.get('[data-cy="tutor-send"]').click();

    // Check tutor response area
    cy.get('[data-cy="tutor-output"]').should(
      'contain.text',
      'Mevcut kanıt kartlarını incelediğinizde sistemin bütünlüğünü koruyacak adımı nasıl belirlersiniz?'
    );
  });

  it('enforces AC-13: Tutor cannot open when JUSTIFY.dlg is active', () => {
    // Select an option and confirm to open JUSTIFY.dlg
    cy.get('[data-cy="choice-D1_ROLLBACK_NOW"]').click();
    cy.get('[data-cy="confirm-decision-btn"]').click();
    cy.get('[data-cy="justify-dlg"]').should('be.visible');

    // Tutor button should be disabled
    cy.get('[data-cy="tutor-btn"]').should('be.disabled');
  });
});
