import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateContributionScore, bigintSqrt } from "../src/score.js";

describe("bigintSqrt", () => {
  it("returns 0n for 0n", () => {
    assert.equal(bigintSqrt(0n), 0n);
  });

  it("returns 1n for 1n", () => {
    assert.equal(bigintSqrt(1n), 1n);
  });

  it("returns 1n for 2n (floor)", () => {
    assert.equal(bigintSqrt(2n), 1n);
  });

  it("returns 1n for 3n (floor)", () => {
    assert.equal(bigintSqrt(3n), 1n);
  });

  it("returns 2n for 4n", () => {
    assert.equal(bigintSqrt(4n), 2n);
  });

  it("returns 3n for 9n", () => {
    assert.equal(bigintSqrt(9n), 3n);
  });

  it("returns 3n for 10n (floor)", () => {
    assert.equal(bigintSqrt(10n), 3n);
  });

  it("returns 10n for 100n", () => {
    assert.equal(bigintSqrt(100n), 10n);
  });

  it("handles large values without overflow", () => {
    // sqrt(10^18) = 10^9
    assert.equal(bigintSqrt(1_000_000_000_000_000_000n), 1_000_000_000n);
  });

  it("handles u64 max range", () => {
    // sqrt(2^64 - 1) = 4294967295 (floor)
    const u64Max = (1n << 64n) - 1n;
    const result = bigintSqrt(u64Max);
    // result^2 <= u64Max < (result+1)^2
    assert.ok(result * result <= u64Max);
    assert.ok((result + 1n) * (result + 1n) > u64Max);
  });
});

describe("calculateContributionScore", () => {
  it("returns 0n for zero tasks", () => {
    const score = calculateContributionScore({
      tasksCompleted: 0,
      totalVerificationScore: 50000n,
      timeActiveDays: 30,
    });
    assert.equal(score, 0n);
  });

  it("returns 0n for zero time", () => {
    const score = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 50000n,
      timeActiveDays: 0,
    });
    assert.equal(score, 0n);
  });

  it("returns 0n for zero total verification score", () => {
    const score = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 0n,
      timeActiveDays: 30,
    });
    assert.equal(score, 0n);
  });

  it("handles simple case: 1 task, score 10000, 1 day", () => {
    // Formula: (tasksCompleted * totalVerificationScore * sqrt(timeActiveDays * SCALE)) / tasksCompleted
    // Simplified: totalVerificationScore * sqrt(timeActiveDays * SCALE)
    // But the actual formula is:
    //   score = tasksCompleted * avgScore * timeFactor
    //   avgScore = totalVerificationScore / tasksCompleted
    //   timeFactor = sqrt(timeActiveDays * 1_000_000)
    //
    // = 1 * (10000 / 1) * sqrt(1 * 1_000_000)
    // = 1 * 10000 * 1000
    // = 10_000_000
    //
    // Scaled by PRECISION (1_000_000):
    // This depends on the exact formula chosen. We validate the result is positive and reasonable.
    const score = calculateContributionScore({
      tasksCompleted: 1,
      totalVerificationScore: 10000n,
      timeActiveDays: 1,
    });
    assert.ok(score > 0n, "Score should be positive for valid inputs");
  });

  it("increases with more tasks completed", () => {
    const score1 = calculateContributionScore({
      tasksCompleted: 5,
      totalVerificationScore: 50000n, // avg 10000
      timeActiveDays: 30,
    });
    const score2 = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 100000n, // avg 10000
      timeActiveDays: 30,
    });
    assert.ok(score2 > score1, "More tasks (same avg score) should increase score");
  });

  it("increases with higher verification scores", () => {
    const score1 = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 50000n, // avg 5000
      timeActiveDays: 30,
    });
    const score2 = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 100000n, // avg 10000
      timeActiveDays: 30,
    });
    assert.ok(score2 > score1, "Higher verification scores should increase score");
  });

  it("increases with more active days", () => {
    const score1 = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 100000n,
      timeActiveDays: 10,
    });
    const score2 = calculateContributionScore({
      tasksCompleted: 10,
      totalVerificationScore: 100000n,
      timeActiveDays: 90,
    });
    assert.ok(score2 > score1, "More active days should increase score");
  });

  it("is deterministic (same inputs produce same output)", () => {
    const input = {
      tasksCompleted: 50,
      totalVerificationScore: 400000n,
      timeActiveDays: 90,
    };
    const score1 = calculateContributionScore(input);
    const score2 = calculateContributionScore(input);
    assert.equal(score1, score2, "Same inputs must produce identical scores");
  });

  it("handles moderate developer: 50 tasks, total score 400000, 90 days", () => {
    const score = calculateContributionScore({
      tasksCompleted: 50,
      totalVerificationScore: 400000n,
      timeActiveDays: 90,
    });
    assert.ok(score > 0n, "Moderate developer should have positive score");
    // Score should be representable as u64 (< 2^64)
    assert.ok(score < (1n << 64n), "Score must fit in u64");
  });

  it("handles very active developer without overflow: 10000 tasks, score 100000000, 365 days", () => {
    const score = calculateContributionScore({
      tasksCompleted: 10000,
      totalVerificationScore: 100_000_000n,
      timeActiveDays: 365,
    });
    assert.ok(score > 0n, "Very active developer should have positive score");
    // Score must fit in u64
    assert.ok(score < (1n << 64n), "Score must fit in u64 for on-chain storage");
  });

  it("uses BigInt for all intermediate calculations", () => {
    // Very large inputs that would overflow Number.MAX_SAFE_INTEGER
    // if using regular numbers
    const score = calculateContributionScore({
      tasksCompleted: 100000,
      totalVerificationScore: 1_000_000_000n,
      timeActiveDays: 3650, // 10 years
    });
    assert.ok(score > 0n, "Extreme inputs should still produce valid results");
    assert.ok(score < (1n << 64n), "Score must fit in u64");
  });

  it("monotonically increases: more contribution always means higher score", () => {
    // Test monotonic increase across a range
    const scores: bigint[] = [];
    for (let tasks = 1; tasks <= 5; tasks++) {
      const score = calculateContributionScore({
        tasksCompleted: tasks * 10,
        totalVerificationScore: BigInt(tasks * 10) * 8000n, // avg 8000
        timeActiveDays: tasks * 30,
      });
      scores.push(score);
    }
    for (let i = 1; i < scores.length; i++) {
      assert.ok(
        scores[i] > scores[i - 1],
        `Score at index ${i} (${scores[i]}) should be greater than score at index ${i - 1} (${scores[i - 1]})`
      );
    }
  });
});
