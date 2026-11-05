// Cypress support file
import './commands';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', () => {
  return false;
});

// The earlier specs drive fixed clicks, so the model stays off by default. Specs that exercise it
// opt in with ?model=1: model.cy.ts and the 8-path regression in paths.cy.ts.
Cypress.on('window:before:load', (win) => {
  win.localStorage.setItem('humanexe.modelKapali', '1');
});
