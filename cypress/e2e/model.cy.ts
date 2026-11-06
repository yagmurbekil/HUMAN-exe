/// <reference types="cypress" />
import parite from '../../tests/parite.json';

const TOLERANCE = parite.tolerans;

describe('HUMAN.exe — Risky-choice prototype model (spec.md §12)', () => {
  describe('AE9: differential test against the Python oracle', () => {
    parite.vakalar.forEach((vaka) => {
      it(`browser matches Python for ${vaka.ad}`, () => {
        cy.visit('/?parite=1');
        Object.entries(vaka.girdi).forEach(([name, value]) => {
          cy.get(`[data-cy="f-${name}"]`).clear().type(String(value));
        });
        cy.get('[data-cy="hesapla"]').click();
        cy.get('[data-cy="p"]', { timeout: 20000 })
          .should(($p) => expect($p.text()).to.match(/^\d\.\d{8}$/))
          .then(($p) => {
            expect(Math.abs(Number($p.text()) - vaka.p_python)).to.be.lessThan(TOLERANCE);
          });
      });

      it(`server matches Python for ${vaka.ad}`, () => {
        cy.request('POST', '/api/risk', { girdi: vaka.girdi }).then(({ body }) => {
          expect(Math.abs(body.p - vaka.p_python)).to.be.lessThan(TOLERANCE);
        });
      });
    });

    it('browser loads the commit-pinned model from Hugging Face', () => {
      cy.intercept('GET', '**/resolve/*/model.onnx').as('hubModel');
      cy.visit('/?parite=1');
      cy.get('[data-cy="hesapla"]').click();
      cy.wait('@hubModel', { timeout: 20000 }).its('request.url').should('not.include', '/resolve/main/');
      cy.get('[data-cy="model-kaynak"]', { timeout: 20000 }).should('contain.text', 'huggingface');
    });

    it('server rejects a request that breaks the input contract', () => {
      cy.request({ method: 'POST', url: '/api/risk', body: { girdi: { seviye: 0 } }, failOnStatusCode: false })
        .its('status')
        .should('eq', 400);
    });
  });

  describe('AE8: the model changes the game', () => {
    beforeEach(() => {
      cy.stubTutorApi();
      cy.visit('/?model=1');
      cy.completeOnboarding('beginner', 'developer', 'risk');
    });

    it('rushed player: DOGRULA.dlg opens, lists unviewed cards, and review keeps the selection', () => {
      cy.get('[data-cy="choice-D1_VERIFY_SCHEMA"]').click();
      cy.get('[data-cy="confirm-decision-btn"]').click();

      cy.get('[data-cy="dogrula-dlg"]', { timeout: 20000 }).should('be.visible');
      cy.get('[data-cy="justify-dlg"]').should('not.exist');
      cy.get('[data-cy="dogrula-kartlar"] li').should('have.length', 3);
      cy.get('[data-cy="p"]').invoke('attr', 'data-p').then((p) => expect(Number(p)).to.be.at.least(0.5));
      cy.get('[data-cy="dogrula-dlg"]').should('contain.text', 'Sentetik veriyle eğitilmiş prototip');

      cy.get('[data-cy="dogrula-gozden-gecir"]').click();
      cy.get('[data-cy="dogrula-dlg"]').should('not.exist');
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.get('[data-cy="choice-D1_VERIFY_SCHEMA"] input').should('be.checked');

      cy.get('[data-cy="confirm-decision-btn"]').click();
      cy.get('[data-cy="dogrula-eminim"]', { timeout: 20000 }).click();
      cy.get('[data-cy="justify-dlg"]').should('be.visible');
    });

    it('same scene, careful player: all cards and the tutor, so JUSTIFY.dlg opens directly', () => {
      cy.get('.win95-tab').each(($tab) => cy.wrap($tab).click());
      cy.get('[data-cy="tutor-btn"]').click();
      cy.get('[data-cy="hint-btn"]').click();
      cy.get('[data-cy="tutor-btn"]').click();
      cy.get('[data-cy="choice-D1_VERIFY_SCHEMA"]').click();
      cy.get('[data-cy="confirm-decision-btn"]').click();

      cy.get('[data-cy="justify-dlg"]', { timeout: 20000 }).should('be.visible');
      cy.get('[data-cy="dogrula-dlg"]').should('not.exist');
    });
  });

  it('game still works when the model cannot be downloaded', () => {
    cy.intercept('GET', '**/config.json', { statusCode: 500 });
    cy.stubTutorApi();
    cy.visit('/?model=1');
    cy.completeOnboarding('beginner', 'developer', 'risk');
    cy.get('[data-cy="choice-D1_ROLLBACK_NOW"]').click();
    cy.get('[data-cy="confirm-decision-btn"]').click();
    cy.get('[data-cy="justify-dlg"]', { timeout: 20000 }).should('be.visible');
  });

  it('is off in data-collection mode so it cannot influence its own labels', () => {
    cy.stubTutorApi();
    cy.visit('/?veri=1&model=1');
    cy.completeOnboarding('beginner', 'developer', 'risk');
    cy.get('[data-cy="choice-D1_ROLLBACK_NOW"]').click();
    cy.get('[data-cy="confirm-decision-btn"]').click();
    cy.get('[data-cy="justify-dlg"]').should('be.visible');
    cy.get('[data-cy="dogrula-dlg"]').should('not.exist');
  });
});
