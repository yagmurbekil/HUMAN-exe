/// <reference types="cypress" />

describe('HUMAN.exe — Mobile Responsiveness (360px & 390px Viewports)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
  });

  it('renders without horizontal overflow at 360 × 640 mobile viewport', () => {
    cy.viewport(360, 640);
    cy.visit('/');

    // Check onboarding window fits
    cy.get('[data-cy="onboarding-window"]').should('be.visible');

    // Check no horizontal scrollbar on body / root
    cy.window().then((win) => {
      const scrollWidth = win.document.documentElement.scrollWidth;
      const innerWidth = win.innerWidth;
      expect(scrollWidth).to.be.at.most(innerWidth + 1); // allow 1px rounding tolerance
    });

    // Complete onboarding on mobile
    cy.completeOnboarding('beginner', 'developer', 'risk');

    // Decision window on mobile
    cy.get('[data-cy="decision-window"]').should('be.visible');
    cy.window().then((win) => {
      const scrollWidth = win.document.documentElement.scrollWidth;
      const innerWidth = win.innerWidth;
      expect(scrollWidth).to.be.at.most(innerWidth + 1);
    });

    // Simulated clock in taskbar is visible
    cy.get('[data-cy="simulated-clock"]').should('be.visible');
  });

  it('renders without horizontal overflow at 390 × 844 (iPhone 12/13/14)', () => {
    cy.viewport(390, 844);
    cy.visit('/');

    cy.window().then((win) => {
      const scrollWidth = win.document.documentElement.scrollWidth;
      const innerWidth = win.innerWidth;
      expect(scrollWidth).to.be.at.most(innerWidth + 1);
    });
  });
});
