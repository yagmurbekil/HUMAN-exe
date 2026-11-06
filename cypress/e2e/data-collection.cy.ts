/// <reference types="cypress" />
import { CSV_COLUMNS, FEATURE_ORDER, toCsv } from '../../src/utils/telemetry';

const STORE_KEY = 'humanexe.oturumlar.v1';
const MODE_KEY = 'humanexe.veriModu';
const resetStorage = (win: Window) => {
  win.localStorage.removeItem(STORE_KEY);
  win.localStorage.removeItem(MODE_KEY);
};

describe('HUMAN.exe — Data collection mode (spec.md §12.3)', () => {
  beforeEach(() => {
    cy.stubTutorApi();
  });

  it('records one row per decision with behaviour features and no personal data', () => {
    cy.visit('/?veri=1', { onBeforeLoad: resetStorage });
    cy.get('[data-cy="data-mode-badge"]').should('be.visible');
    cy.completeOnboarding('advanced', 'qa', 'risk');

    // D1: open two more cards, switch option once, then choose the risky one
    cy.get('.win95-tab').eq(1).click();
    cy.get('.win95-tab').eq(2).click();
    cy.get('[data-cy="choice-D1_VERIFY_SCHEMA"]').click();
    cy.get('[data-cy="choice-D1_ROLLBACK_NOW"]').click();
    cy.get('[data-cy="confirm-decision-btn"]').click();
    cy.get('[data-cy="justification-option-0"]').click();
    cy.get('[data-cy="justify-confirm-btn"]').click();
    cy.get('[data-cy="continue-btn"]').click();

    // D2: open tutor and use one hint before deciding
    cy.get('[data-cy="tutor-btn"]').click();
    cy.get('[data-cy="hint-btn"]').click();
    cy.get('[data-cy="tutor-btn"]').click();
    cy.makeDecisionAndJustify('D2_SMOKE_TEST', 0);
    cy.makeDecisionAndJustify('D3_SHARE_RAW', 0);

    cy.get('[data-cy="data-panel"]').should('be.visible');
    cy.get('[data-cy="data-session-count"]').should('have.text', '1');
    cy.get('[data-cy="data-row-count"]').should('have.text', '3');

    cy.window().then((win) => {
      const rows = JSON.parse(win.localStorage.getItem(STORE_KEY) || '[]');
      expect(rows).to.have.length(3);
      expect(new Set(rows.map((r: any) => r.oturum_id)).size).to.equal(1);
      expect(rows[0].oturum_id).to.match(/^[0-9a-f]{12}$/);

      // Only the documented columns are stored (no personal data fields)
      rows.forEach((r: any) => expect(Object.keys(r).sort()).to.deep.equal([...CSV_COLUMNS].sort()));

      const [d1, d2, d3] = rows;
      expect(d1).to.include({
        karar_id: 'D1', karar_no: 1, seviye: 2, riskli_secim: 1, kaynak: 'gercek', uretim_turu: 'oyun-oturumu',
      });
      expect(d1.kart_orani).to.equal(0.75); // 3 of 4 cards
      expect(d1.secim_degisikligi).to.equal(1);
      expect(d1.tutor_acildi).to.equal(0);
      expect(d1.karar_suresi_sn).to.be.greaterThan(0);

      expect(d2).to.include({ karar_id: 'D2', riskli_secim: 0, tutor_acildi: 1, ipucu_sayisi: 1, onceki_riskli: 1 });
      expect(d3).to.include({ karar_id: 'D3', riskli_secim: 1, onceki_riskli: 1 });
      FEATURE_ORDER.forEach((f) => rows.forEach((r: any) => expect(r[f], f).to.be.a('number')));

      const csv = toCsv(rows).trim().split('\n');
      expect(csv[0]).to.equal(CSV_COLUMNS.join(','));
      expect(csv).to.have.length(4);
    });
  });

  it('stores nothing outside data-collection mode', () => {
    cy.visit('/', { onBeforeLoad: resetStorage });
    cy.get('[data-cy="data-mode-badge"]').should('not.exist');
    cy.completeOnboarding('beginner', 'developer', 'privacy');
    cy.makeDecisionAndJustify('D1_VERIFY_SCHEMA', 0);
    cy.makeDecisionAndJustify('D2_SMOKE_TEST', 0);
    cy.makeDecisionAndJustify('D3_REDACT_RESTRICT', 0);
    cy.get('[data-cy="report-window"]').should('be.visible');
    cy.get('[data-cy="data-panel"]').should('not.exist');
    cy.window().then((win) => expect(win.localStorage.getItem(STORE_KEY)).to.equal(null));
  });

  it('can be switched on from the Start menu and is remembered after reload', () => {
    cy.visit('/', { onBeforeLoad: resetStorage });
    cy.get('[data-cy="data-mode-badge"]').should('not.exist');
    cy.get('[data-cy="start-menu-btn"]').click();
    cy.get('[data-cy="start-menu-data-mode"]').should('contain.text', 'Kapalı').click();
    cy.get('[data-cy="data-mode-badge"]').should('be.visible');
    cy.reload();
    cy.get('[data-cy="data-mode-badge"]').should('be.visible');
    cy.get('[data-cy="start-menu-btn"]').click();
    cy.get('[data-cy="start-menu-data-mode"]').should('contain.text', 'Açık').click();
    cy.get('[data-cy="data-mode-badge"]').should('not.exist');
  });
});
