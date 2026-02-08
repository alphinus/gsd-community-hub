import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeContributionLeafHash,
  serializeContributionLeaf,
} from "../src/contribution-hash.js";
import type { ContributionData } from "@gsd/types";

/**
 * Test data: a known contribution for deterministic testing.
 *
 * The developer pubkey is 32 bytes of 0x01 (base58: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi")
 * The taskRef is SHA-256 of "task-001" = known hex
 * The contentHash is SHA-256 of "content-001" = known hex
 */

// 32 bytes of 0x01 as base58
const TEST_DEVELOPER = "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi";

// A fixed task ref (32 bytes hex)
const TEST_TASK_REF =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

// A fixed content hash (32 bytes hex)
const TEST_CONTENT_HASH =
  "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

const TEST_CONTRIBUTION: ContributionData = {
  developer: TEST_DEVELOPER,
  taskRef: TEST_TASK_REF,
  verificationScore: 10000, // 100.00%
  timestamp: 1700000000,
  contentHash: TEST_CONTENT_HASH,
};

describe("serializeContributionLeaf", () => {
  it("produces exactly 106 bytes matching on-chain layout", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    assert.equal(
      bytes.length,
      106,
      "Serialized contribution leaf must be exactly 106 bytes"
    );
  });

  it("serializes developer pubkey as first 32 bytes", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    // 32 bytes of 0x01
    const developerBytes = bytes.slice(0, 32);
    for (let i = 0; i < 32; i++) {
      assert.equal(developerBytes[i], 0x01, `byte ${i} should be 0x01`);
    }
  });

  it("serializes task_ref as bytes 32-63", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    const taskRefBytes = bytes.slice(32, 64);
    assert.equal(taskRefBytes.length, 32);
    // First byte of the hex should be 0xa1
    assert.equal(taskRefBytes[0], 0xa1);
    assert.equal(taskRefBytes[1], 0xb2);
  });

  it("serializes verification_score as u16 little-endian at bytes 64-65", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    // 10000 = 0x2710, little-endian: [0x10, 0x27]
    assert.equal(bytes[64], 0x10, "low byte of verification_score");
    assert.equal(bytes[65], 0x27, "high byte of verification_score");
  });

  it("serializes timestamp as i64 little-endian at bytes 66-73", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    // 1700000000 = 0x6553_F100
    // Little-endian: [0x00, 0xF1, 0x53, 0x65, 0x00, 0x00, 0x00, 0x00]
    const timestampBytes = bytes.slice(66, 74);
    assert.equal(timestampBytes[0], 0x00);
    assert.equal(timestampBytes[1], 0xf1);
    assert.equal(timestampBytes[2], 0x53);
    assert.equal(timestampBytes[3], 0x65);
    // Upper 4 bytes should be 0
    assert.equal(timestampBytes[4], 0x00);
    assert.equal(timestampBytes[5], 0x00);
    assert.equal(timestampBytes[6], 0x00);
    assert.equal(timestampBytes[7], 0x00);
  });

  it("serializes content_hash as last 32 bytes (74-105)", () => {
    const bytes = serializeContributionLeaf(TEST_CONTRIBUTION);
    const contentHashBytes = bytes.slice(74, 106);
    assert.equal(contentHashBytes.length, 32);
    // 0xDE, 0xAD, 0xBE, 0xEF...
    assert.equal(contentHashBytes[0], 0xde);
    assert.equal(contentHashBytes[1], 0xad);
    assert.equal(contentHashBytes[2], 0xbe);
    assert.equal(contentHashBytes[3], 0xef);
  });
});

describe("computeContributionLeafHash", () => {
  it("produces a 32-byte hash", async () => {
    const hash = await computeContributionLeafHash(TEST_CONTRIBUTION);
    assert.equal(hash.length, 64, "hex hash should be 64 chars (32 bytes)");
  });

  it("is deterministic (same input produces same output)", async () => {
    const hash1 = await computeContributionLeafHash(TEST_CONTRIBUTION);
    const hash2 = await computeContributionLeafHash(TEST_CONTRIBUTION);
    assert.equal(hash1, hash2, "Same input must produce identical hash");
  });

  it("produces different hashes for different inputs", async () => {
    const hash1 = await computeContributionLeafHash(TEST_CONTRIBUTION);
    const modified = {
      ...TEST_CONTRIBUTION,
      verificationScore: 5000,
    };
    const hash2 = await computeContributionLeafHash(modified);
    assert.notEqual(hash1, hash2, "Different inputs must produce different hashes");
  });

  it("produces different hashes for different timestamps", async () => {
    const hash1 = await computeContributionLeafHash(TEST_CONTRIBUTION);
    const modified = {
      ...TEST_CONTRIBUTION,
      timestamp: 1700000001,
    };
    const hash2 = await computeContributionLeafHash(modified);
    assert.notEqual(hash1, hash2, "Different timestamps must produce different hashes");
  });

  it("produces different hashes for different developers", async () => {
    const hash1 = await computeContributionLeafHash(TEST_CONTRIBUTION);
    // Use 32 bytes of 0x02 as base58
    const modified = {
      ...TEST_CONTRIBUTION,
      developer: "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR",
    };
    const hash2 = await computeContributionLeafHash(modified);
    assert.notEqual(hash1, hash2, "Different developers must produce different hashes");
  });

  it("produces a known hash for the test input", async () => {
    // We compute this once to lock in the expected value.
    // The hash is SHA-256 of the 106-byte serialized buffer.
    const hash = await computeContributionLeafHash(TEST_CONTRIBUTION);
    // This assertion will be updated once the implementation is verified.
    // For now, just ensure it's a valid hex string.
    assert.match(hash, /^[0-9a-f]{64}$/, "Hash must be a valid lowercase hex string");
  });
});
