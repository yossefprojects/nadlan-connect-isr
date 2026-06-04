import { describe, it, expect } from "vitest";
import { calcEstimation, calcInvestmentScore } from "./engine.js";

describe("calcEstimation", () => {
  it("estimates a Tel Aviv resale flat (no floor/room bonus)", () => {
    // 55000 * 80 * 1.0 * 1.0 * 1.0 = 4,400,000
    expect(
      calcEstimation({
        ville: "tlv",
        surface: 80,
        nbPieces: 3,
        etage: 3,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 4_400_000 });
  });

  it("applies new-development, high-floor and extra-room bonuses together", () => {
    // 55000 * 80 * 1.15 * 1.05 * (1 + (4-3)*0.02) = 5,419,260
    expect(
      calcEstimation({
        ville: "tlv",
        surface: 80,
        nbPieces: 4,
        etage: 8,
        type: "new_development",
      }),
    ).toEqual({ estimatedPrice: 5_419_260 });
  });

  it("applies a positive room bonus for large apartments", () => {
    // 32000 * 120 * 1.0 * 1.0 * (1 + (5-3)*0.02) = 3,993,600
    expect(
      calcEstimation({
        ville: "jer",
        surface: 120,
        nbPieces: 5,
        etage: 2,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 3_993_600 });
  });

  it("applies a negative room bonus and handles a missing floor", () => {
    // 10000 * 35 * 1.0 * 1.0 * (1 + (2-3)*0.02) = 343,000
    expect(
      calcEstimation({
        ville: "bs",
        surface: 35,
        nbPieces: 2,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 343_000 });
  });

  it("falls back to the default base price for an unknown city", () => {
    // 20000 * 100 * 1.0 * 1.0 * 1.0 = 2,000,000
    expect(
      calcEstimation({
        ville: "xxx",
        surface: 100,
        nbPieces: 3,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 2_000_000 });
  });

  it("treats floor 5 as not high enough for the floor bonus", () => {
    // 22000 * 60 * 1.0 * (etage 5 -> 1.0) * 1.0 = 1,320,000
    expect(
      calcEstimation({
        ville: "hfa",
        surface: 60,
        nbPieces: 3,
        etage: 5,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 1_320_000 });
  });

  it("applies the floor bonus at floor 6", () => {
    // 22000 * 60 * 1.0 * 1.05 * 1.0 = 1,386,000
    expect(
      calcEstimation({
        ville: "hfa",
        surface: 60,
        nbPieces: 3,
        etage: 6,
        type: "resale",
      }),
    ).toEqual({ estimatedPrice: 1_386_000 });
  });

  it("defaults to resale multiplier when type is omitted", () => {
    expect(
      calcEstimation({ ville: "tlv", surface: 80, nbPieces: 3 }),
    ).toEqual({ estimatedPrice: 4_400_000 });
  });
});

describe("calcInvestmentScore", () => {
  it("rewards a well-below-market price", () => {
    // tlv base 80 + below-0.9 (+15) = 95
    expect(
      calcInvestmentScore({
        ville: "tlv",
        type: "resale",
        price: 850,
        estimatedPrice: 1000,
        surface: 80,
      }),
    ).toEqual({ score: 95 });
  });

  it("gives a smaller bonus for a slightly-below-market price", () => {
    // tlv base 80 + below-1.0 (+8) = 88
    expect(
      calcInvestmentScore({
        ville: "tlv",
        type: "resale",
        price: 950,
        estimatedPrice: 1000,
        surface: 80,
      }),
    ).toEqual({ score: 88 });
  });

  it("penalizes an overpriced listing but rewards new dev + large surface", () => {
    // tlv base 80 + over-1.1 (-10) + new_dev (+5) + surface>120 (+3) = 78
    expect(
      calcInvestmentScore({
        ville: "tlv",
        type: "new_development",
        price: 1200,
        estimatedPrice: 1000,
        surface: 130,
      }),
    ).toEqual({ score: 78 });
  });

  it("applies the mild-overprice penalty and small-surface penalty", () => {
    // bs base 55 + over-1.05 (-5) + surface<40 (-3) = 47
    expect(
      calcInvestmentScore({
        ville: "bs",
        type: "resale",
        price: 1070,
        estimatedPrice: 1000,
        surface: 35,
      }),
    ).toEqual({ score: 47 });
  });

  it("returns the city base score when at market with no modifiers", () => {
    // jer base 70, ratio 1.0 (no change), surface neutral = 70
    expect(
      calcInvestmentScore({
        ville: "jer",
        type: "resale",
        price: 1000,
        estimatedPrice: 1000,
        surface: 100,
      }),
    ).toEqual({ score: 70 });
  });

  it("falls back to the default base score for an unknown city", () => {
    // unknown base 50 + over-1.1 (-10) + surface<40 (-3) = 37
    expect(
      calcInvestmentScore({
        ville: "zzz",
        type: "resale",
        price: 1200,
        estimatedPrice: 1000,
        surface: 30,
      }),
    ).toEqual({ score: 37 });
  });

  it("clamps the score to a maximum of 100", () => {
    expect(
      calcInvestmentScore({
        ville: "tlv",
        type: "new_development",
        price: 100,
        estimatedPrice: 1000,
        surface: 200,
      }),
    ).toEqual({ score: 100 });
  });

  it("never returns a score outside the 0-100 range across many inputs", () => {
    const villes = ["tlv", "jer", "hfa", "nat", "ash", "bs", "unknown"];
    const types = ["resale", "new_development", undefined];
    const ratios = [0.5, 0.85, 0.95, 1.0, 1.07, 1.2, 3.0];
    const surfaces = [25, 50, 80, 130];
    for (const ville of villes) {
      for (const type of types) {
        for (const ratio of ratios) {
          for (const surface of surfaces) {
            const estimatedPrice = 1_000_000;
            const { score } = calcInvestmentScore({
              ville,
              type,
              price: Math.round(estimatedPrice * ratio),
              estimatedPrice,
              surface,
            });
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            expect(Number.isInteger(score)).toBe(true);
          }
        }
      }
    }
  });
});
