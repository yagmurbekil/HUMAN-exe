/// <reference types="cypress" />
import { DECISIONS } from '../../src/data/scenarioData';
import { OptionId, Flag } from '../../src/types';

describe('HUMAN.exe — AC-14: Deterministic Scenario Logic Matrix', () => {
  let paths: any[] = [];

  before(() => {
    cy.fixture('paths.json').then((data) => {
      paths = data;
    });
  });

  it('validates that all 8 paths calculate exact flags and endings without UI drift', () => {
    paths.forEach((p) => {
      const accumulatedFlags: Flag[] = [];

      p.decisions.forEach((d: { id: string; choice: OptionId }) => {
        const decDef = DECISIONS[d.id as 'D1' | 'D2' | 'D3'];
        const chosenOpt = decDef.options.find((o) => o.id === d.choice);
        expect(chosenOpt, `Option ${d.choice} exists in ${d.id}`).to.not.be.undefined;

        if (chosenOpt?.flag) {
          accumulatedFlags.push(chosenOpt.flag);
        }
      });

      // Verify calculated flags match fixture
      expect(accumulatedFlags).to.deep.equal(
        p.expectedFlags,
        `${p.pathId} flag accumulation mismatch`
      );

      // Verify calculated ending matches fixture
      const calculatedEnding =
        accumulatedFlags.length === 0 ? 'SAFE_RECOVERY' : 'UNSAFE_RECOVERY';
      expect(calculatedEnding).to.equal(
        p.expectedEnding,
        `${p.pathId} ending mismatch`
      );
    });
  });
});
