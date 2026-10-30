/// <reference types="cypress" />
import { DECISIONS, getOrderedEvidenceCards } from '../../src/data/scenarioData';
import { checkForbiddenGuard } from '../../src/utils/tutorLogic';
import { DecisionId, Role } from '../../src/types';

const DECISION_IDS: DecisionId[] = ['D1', 'D2', 'D3'];

describe('HUMAN.exe — Regression: critical review fixes', () => {
  describe('Hint ladder does not leak the answer (§8.1, §9.2)', () => {
    // Phrases that recommend or judge an option (L2/L3) — including the previously leaked step-3 texts
    const leakPhrases = [
      'güvenli değil',
      'şarttır',
      'doğru öneri',
      'yapmalısın',
      'seçmelisin',
      'smoke test şart',
      'ASSIST.exe bu kez doğru',
      'geri alma güvenli',
      'maskelemek (redaction) ve erişimi',
    ];

    DECISION_IDS.forEach((id) => {
      it(`${id}: no ladder step names an option, an option id, or a recommendation`, () => {
        const decision = DECISIONS[id];
        decision.hintLadder.forEach((hint, step) => {
          expect(checkForbiddenGuard(hint), `${id} step ${step + 1} triggers guard`).to.equal(false);
          decision.options.forEach((opt) => {
            expect(hint, `${id} step ${step + 1} quotes option`).not.to.include(opt.text);
            expect(hint, `${id} step ${step + 1} names option id`).not.to.include(opt.id);
          });
          leakPhrases.forEach((phrase) => {
            expect(hint.toLocaleLowerCase('tr-TR'), `${id} step ${step + 1}: "${phrase}"`).not.to.include(
              phrase.toLocaleLowerCase('tr-TR')
            );
          });
        });
      });

      it(`${id}: step 3 is a concept explanation that ends with a question`, () => {
        const step3 = DECISIONS[id].hintLadder[2];
        expect(step3.trim().endsWith('?'), `${id} step 3: ${step3}`).to.equal(true);
      });
    });
  });

  describe('Guard handles Turkish dotted capital İ (§9.3)', () => {
    it('catches forbidden terms written with İ / uppercase', () => {
      expect(checkForbiddenGuard('İkinci seçenek daha iyi.')).to.equal(true);
      expect(checkForbiddenGuard('İKİNCİ SEÇENEK')).to.equal(true);
      expect(checkForbiddenGuard('Birinci Seçenek doğru.')).to.equal(true);
      expect(checkForbiddenGuard('ASSIST.EXE HAKLI')).to.equal(true);
      expect(checkForbiddenGuard('Assist.exe haklı görünüyor.')).to.equal(true);
      expect(checkForbiddenGuard('D1_ROLLBACK_NOW')).to.equal(true);
    });

    it('keeps boundary-aware behaviour (no false positives)', () => {
      expect(checkForbiddenGuard('Doğrudan bir seçenek belirtemem; sorumluluk sizde.')).to.equal(false);
      expect(checkForbiddenGuard('Paylaşmadan önce hangi alanları incelersin?')).to.equal(false);
      expect(checkForbiddenGuard('İzole birim testleri neyi kanıtlamaz?')).to.equal(false);
    });
  });

  describe('Role-based evidence ordering (§8.2)', () => {
    const expected: Record<Role, Record<DecisionId, string>> = {
      developer: { D1: 'MIGRATION_DIFF', D2: 'HOTFIX_DIFF', D3: 'LOG_SAMPLE' },
      qa: { D1: 'RELEASE_NOTES', D2: 'CI_STATUS', D3: 'LOG_SAMPLE' },
      tech_lead: { D1: 'STAKEHOLDER_MSG', D2: 'STAKEHOLDER_MSG', D3: 'DATA_POLICY' },
    };

    it('pins the spec card first for every role × decision and keeps all cards', () => {
      (Object.keys(expected) as Role[]).forEach((role) => {
        DECISION_IDS.forEach((id) => {
          const cards = DECISIONS[id].evidenceCards;
          const ordered = getOrderedEvidenceCards(cards, role, id);
          expect(ordered[0].id, `${role} ${id}`).to.equal(expected[role][id]);
          expect(ordered.map((c) => c.id).sort()).to.deep.equal(cards.map((c) => c.id).sort());
        });
      });
    });

    it('shows DATA_POLICY first for Technical Lead on D3 in the UI', () => {
      cy.stubTutorApi();
      cy.visit('/');
      cy.completeOnboarding('intermediate', 'tech_lead', 'privacy');
      cy.makeDecisionAndJustify('D1_VERIFY_SCHEMA', 0);
      cy.makeDecisionAndJustify('D2_SMOKE_TEST', 0);
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.get('.win95-tab').first().should('contain.text', 'DATA_POLICY');
    });
  });

  describe('Simulated clock accumulates time costs (§5, §6)', () => {
    it('never goes backwards after a rollback followed by an immediate deploy', () => {
      cy.stubTutorApi();
      cy.visit('/');
      cy.completeOnboarding('intermediate', 'developer', 'risk');
      cy.makeDecisionAndJustify('D1_ROLLBACK_NOW', 0, '08:25');
      // Previously showed 08:17 here (fixed value), moving the clock backwards
      cy.makeDecisionAndJustify('D2_DEPLOY_NOW', 0, '08:27');
      cy.makeDecisionAndJustify('D3_REDACT_RESTRICT', 0, '08:35');
    });
  });

  describe('Tutor resets when the decision changes', () => {
    beforeEach(() => {
      // Wide viewport so the floating tutor window does not cover decision controls
      cy.viewport(1920, 1080);
      cy.stubTutorApi();
      cy.visit('/');
      cy.completeOnboarding('intermediate', 'developer', 'risk');
    });

    it('starts a fresh D2 conversation when the tutor stays open across decisions', () => {
      cy.get('[data-cy="tutor-btn"]').click();
      cy.get('[data-cy="tutor-output"]').should('contain.text', 'D1 kararındasınız');
      cy.get('[data-cy="tutor-input"]').type('Rollback nedir?');
      cy.get('[data-cy="tutor-send"]').click();
      cy.wait('@tutorResponse');
      cy.get('[data-cy="tutor-output"]').should('contain.text', 'Rollback nedir?');

      cy.makeDecisionAndJustify('D1_VERIFY_SCHEMA', 0);

      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.get('[data-cy="tutor-window"]').should('be.visible');
      cy.get('[data-cy="tutor-output"]').should('contain.text', 'D2 kararındasınız');
      cy.get('[data-cy="tutor-output"]').should('not.contain.text', 'D1 kararındasınız');
      cy.get('[data-cy="tutor-output"]').should('not.contain.text', 'Rollback nedir?');
    });
  });

  describe('Session restart requires confirmation (§10)', () => {
    beforeEach(() => {
      cy.stubTutorApi();
      cy.visit('/');
      cy.completeOnboarding('beginner', 'qa', 'privacy');
    });

    it('Start menu restart: "Hayır" keeps the session, "Evet" resets it', () => {
      cy.get('[data-cy="start-menu-btn"]').click();
      cy.get('[data-cy="start-menu-restart"]').click();
      cy.get('[data-cy="restart-confirm-dlg"]').should('be.visible');
      cy.get('[data-cy="restart-confirm-no"]').click();
      cy.get('[data-cy="restart-confirm-dlg"]').should('not.exist');
      cy.get('[data-cy="decision-window"]').should('be.visible');
      cy.get('[data-cy="profile-badge"]').should('contain.text', 'Başlangıç · QA · Gizlilik');

      cy.get('[data-cy="start-menu-btn"]').click();
      cy.get('[data-cy="start-menu-restart"]').click();
      cy.confirmRestart();
      cy.get('[data-cy="onboarding-window"]').should('be.visible');
      cy.get('[data-cy="start-session-btn"]').should('be.disabled');
    });

    it('Report close (X) button asks before restarting', () => {
      cy.makeDecisionAndJustify('D1_VERIFY_SCHEMA', 0);
      cy.makeDecisionAndJustify('D2_SMOKE_TEST', 0);
      cy.makeDecisionAndJustify('D3_REDACT_RESTRICT', 0);
      cy.get('[data-cy="report-window"]').should('be.visible');

      cy.get('[data-cy="report-window"] [aria-label="Close"]').click();
      cy.get('[data-cy="restart-confirm-dlg"]').should('be.visible');
      cy.get('[data-cy="restart-confirm-no"]').click();
      cy.get('[data-cy="report-window"]').should('be.visible');
      cy.get('[data-cy="ending"]').should('contain.text', 'SAFE_RECOVERY');
    });
  });

  describe('Titlebar Tutor button does not overlap window controls', () => {
    const assertNoOverlap = () => {
      cy.get('[data-cy="titlebar-tutor-btn"]').then(($btn) => {
        const btn = $btn[0];
        // The label fits inside the button (no overflow onto neighbours)
        expect(btn.scrollWidth, 'label overflow').to.be.at.most(btn.clientWidth + 1);
        const next = btn.nextElementSibling as HTMLElement;
        expect(btn.getBoundingClientRect().right, 'overlaps next control').to.be.at.most(
          next.getBoundingClientRect().left
        );
      });
    };

    [
      [390, 844],
      [1280, 720],
    ].forEach(([w, h]) => {
      it(`decision and consequence titlebars at ${w}×${h}`, () => {
        cy.viewport(w, h);
        cy.stubTutorApi();
        cy.visit('/');
        cy.completeOnboarding('beginner', 'developer', 'validation');
        assertNoOverlap();
        cy.get('[data-cy="choice-D1_ROLLBACK_NOW"]').click();
        cy.get('[data-cy="confirm-decision-btn"]').click();
        cy.get('[data-cy="justification-option-0"]').click();
        cy.get('[data-cy="justify-confirm-btn"]').click();
        cy.get('[data-cy="consequence-window"]').should('be.visible');
        assertNoOverlap();
      });
    });
  });
});
