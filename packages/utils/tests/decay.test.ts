import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decayMultiplier,
  calculateDecayedScore,
  calculateContributionScoreWithDecay,
  DECAY_HALF_LIFE_DAYS,
} from "../src/decay.js";
import { calculateContributionScore } from "../src/score.js";

describe("DECAY_HALF_LIFE_DAYS constant", () => {
  it("defaults to 180", () => {
    assert.equal(DECAY_HALF_LIFE_DAYS, 180);
  });
});

describe("decayMultiplier", () => {
  it("returns 1.0 for age 0", () => {
    assert.equal(decayMultiplier(0, 180), 1.0);
  });

  it("returns 0.5 for age equal to half-life", () => {
    assert.equal(decayMultiplier(180, 180), 0.5);
  });

  it("returns 0.25 for age equal to two half-lives", () => {
    assert.equal(decayMultiplier(360, 180), 0.25);
  });

  it("returns 0.125 for age equal to three half-lives", () => {
    assert.equal(decayMultiplier(540, 180), 0.125);
  });

  it("returns 1.0 for negative age (clamped to 0)", () => {
    assert.equal(decayMultiplier(-10, 180), 1.0);
  });

  it("returns 1.0 for zero half-life (edge case)", () => {
    assert.equal(decayMultiplier(0, 0), 1.0);
  });

  it("uses default half-life when not specified", () => {
    // decayMultiplier(180) should use default 180-day half-life = 0.5
    assert.equal(decayMultiplier(180), 0.5);
  });

  it("is deterministic: same inputs always produce same output", () => {
    const result1 = decayMultiplier(90, 180);
    const result2 = decayMultiplier(90, 180);
    assert.equal(result1, result2);
  });

  it("returns value between 0 and 1 for positive age", () => {
    const result = decayMultiplier(365, 180);
    assert.ok(result > 0, "Multiplier should be positive");
    assert.ok(result < 1, "Multiplier should be less than 1 for positive age");
  });

  it("decreases monotonically with age", () => {
    const m1 = decayMultiplier(30, 180);
    const m2 = decayMultiplier(90, 180);
    const m3 = decayMultiplier(180, 180);
    const m4 = decayMultiplier(360, 180);
    assert.ok(m1 > m2, "30 days should decay less than 90 days");
    assert.ok(m2 > m3, "90 days should decay less than 180 days");
    assert.ok(m3 > m4, "180 days should decay less than 360 days");
  });
});

describe("calculateDecayedScore", () => {
  it("returns 0n for empty contributions array", () => {
    assert.equal(calculateDecayedScore([]), 0n);
  });

  it("returns full score for single contribution at age 0", () => {
    const result = calculateDecayedScore([
      { verificationScore: 10000, ageDays: 0 },
    ]);
    assert.equal(result, 10000n);
  });

  it("returns half score for single contribution at half-life age", () => {
    const result = calculateDecayedScore([
      { verificationScore: 10000, ageDays: 180 },
    ]);
    assert.equal(result, 5000n);
  });

  it("returns correct weighted sum for multiple contributions with mixed ages", () => {
    const result = calculateDecayedScore([
      { verificationScore: 10000, ageDays: 0 },   // 10000 * 1.0 = 10000
      { verificationScore: 10000, ageDays: 180 },  // 10000 * 0.5 = 5000
    ]);
    assert.equal(result, 15000n);
  });

  it("returns 25% of score at two half-lives", () => {
    const result = calculateDecayedScore([
      { verificationScore: 10000, ageDays: 360 },
    ]);
    assert.equal(result, 2500n);
  });

  it("accepts configurable half-life parameter", () => {
    // With half-life of 90, age 90 should give 0.5 multiplier
    const result = calculateDecayedScore(
      [{ verificationScore: 10000, ageDays: 90 }],
      90
    );
    assert.equal(result, 5000n);
  });

  it("is deterministic: same inputs always produce same output", () => {
    const contributions = [
      { verificationScore: 8000, ageDays: 45 },
      { verificationScore: 6000, ageDays: 120 },
    ];
    const result1 = calculateDecayedScore(contributions);
    const result2 = calculateDecayedScore(contributions);
    assert.equal(result1, result2);
  });
});

describe("calculateContributionScoreWithDecay", () => {
  it("returns lower score than calculateContributionScore when contributions are aged", () => {
    const baseInput = {
      tasksCompleted: 5,
      totalVerificationScore: 50000n,
      timeActiveDays: 30,
    };

    const nonDecayedScore = calculateContributionScore(baseInput);

    const decayedScore = calculateContributionScoreWithDecay({
      ...baseInput,
      contributions: [
        { verificationScore: 10000, ageDays: 90 },
        { verificationScore: 10000, ageDays: 180 },
        { verificationScore: 10000, ageDays: 270 },
        { verificationScore: 10000, ageDays: 360 },
        { verificationScore: 10000, ageDays: 450 },
      ],
    });

    assert.ok(
      decayedScore < nonDecayedScore,
      `Decayed score (${decayedScore}) should be less than non-decayed score (${nonDecayedScore})`
    );
  });

  it("returns equal score when all contributions are age 0", () => {
    const baseInput = {
      tasksCompleted: 3,
      totalVerificationScore: 30000n,
      timeActiveDays: 30,
    };

    const nonDecayedScore = calculateContributionScore(baseInput);

    const decayedScore = calculateContributionScoreWithDecay({
      ...baseInput,
      contributions: [
        { verificationScore: 10000, ageDays: 0 },
        { verificationScore: 10000, ageDays: 0 },
        { verificationScore: 10000, ageDays: 0 },
      ],
    });

    assert.equal(
      decayedScore,
      nonDecayedScore,
      `Decayed score (${decayedScore}) should equal non-decayed score (${nonDecayedScore}) when all contributions are age 0`
    );
  });

  it("accepts configurable halfLifeDays parameter", () => {
    const input = {
      tasksCompleted: 2,
      totalVerificationScore: 20000n,
      timeActiveDays: 30,
      contributions: [
        { verificationScore: 10000, ageDays: 90 },
        { verificationScore: 10000, ageDays: 90 },
      ],
    };

    // Shorter half-life = more decay = lower score
    const score180 = calculateContributionScoreWithDecay(input, 180);
    const score90 = calculateContributionScoreWithDecay(input, 90);

    assert.ok(
      score90 < score180,
      `Score with 90-day half-life (${score90}) should be less than with 180-day half-life (${score180})`
    );
  });

  it("is deterministic: same inputs always produce same output", () => {
    const input = {
      tasksCompleted: 3,
      totalVerificationScore: 30000n,
      timeActiveDays: 60,
      contributions: [
        { verificationScore: 10000, ageDays: 30 },
        { verificationScore: 10000, ageDays: 60 },
        { verificationScore: 10000, ageDays: 90 },
      ],
    };

    const result1 = calculateContributionScoreWithDecay(input);
    const result2 = calculateContributionScoreWithDecay(input);
    assert.equal(result1, result2);
  });
});
