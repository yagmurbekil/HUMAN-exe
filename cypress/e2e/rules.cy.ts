/// <reference types="cypress" />
import { DECISIONS } from '../../src/data/scenarioData';
import { OptionId, Flag } from '../../src/types';
import { START_CLOCK, addMinutes, getClockAfterDecision, getEnding } from '../../src/utils/rules';
import paths from '../fixtures/paths.json';

describe('HUMAN.exe — AC-14: Deterministic Scenario Logic Matrix', () => {
  it('validates that all 8 paths calculate exact flags, endings and clocks without UI drift', () => {
    expect(paths).to.have.length(8);

    paths.forEach((p) => {
      const accumulatedFlags: Flag[] = [];
      const clocks: string[] = [];
      let clock = START_CLOCK;

      p.decisions.forEach((d) => {
        const decDef = DECISIONS[d.id as 'D1' | 'D2' | 'D3'];
        const chosenOpt = decDef.options.find((o) => o.id === (d.choice as OptionId));
        expect(chosenOpt, `Option ${d.choice} exists in ${d.id}`).to.not.be.undefined;

        if (chosenOpt?.flag) {
          accumulatedFlags.push(chosenOpt.flag);
        }
        clock = getClockAfterDecision(clock, chosenOpt!);
        clocks.push(clock);
      });

      // Verify calculated flags match fixture
      expect(accumulatedFlags).to.deep.equal(p.expectedFlags, `${p.pathId} flag accumulation mismatch`);

      // Verify the app's ending rule matches fixture
      expect(getEnding(accumulatedFlags)).to.equal(p.expectedEnding, `${p.pathId} ending mismatch`);

      // Verify accumulated clocks match fixture
      expect(clocks).to.deep.equal(p.expectedClocks, `${p.pathId} clock mismatch`);
    });
  });

  it('never moves the simulated clock backwards on any path', () => {
    paths.forEach((p) => {
      const all = [START_CLOCK, ...p.expectedClocks];
      for (let i = 1; i < all.length; i++) {
        expect(all[i] > all[i - 1], `${p.pathId}: ${all[i - 1]} → ${all[i]}`).to.equal(true);
      }
    });
  });

  it('adds minutes across the hour boundary', () => {
    expect(addMinutes('08:55', 10)).to.equal('09:05');
    expect(addMinutes('08:00', 0)).to.equal('08:00');
  });
});
