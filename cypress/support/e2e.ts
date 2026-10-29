// Cypress support file
import './commands';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', () => {
  return false;
});
