const { computePageRank } = require('../../src/services/trustrank.service');

describe('trustrank.service — computePageRank (Module 5 TrustRank)', () => {
  it('returns empty for no nodes', () => {
    expect(computePageRank([], []).size).toBe(0);
  });

  it('ranks sum to ~1', () => {
    const rank = computePageRank([1, 2, 3], [
      { from: 1, to: 2, weight: 1 },
      { from: 3, to: 2, weight: 1 },
    ]);
    const sum = Array.from(rank.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 3);
  });

  it('the most-endorsed node gets the highest rank', () => {
    // everyone endorses node 2
    const rank = computePageRank([1, 2, 3, 4], [
      { from: 1, to: 2, weight: 1 },
      { from: 3, to: 2, weight: 1 },
      { from: 4, to: 2, weight: 1 },
    ]);
    const top = [...rank.entries()].sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe('2');
  });

  it('higher-weight endorsements propagate more credibility', () => {
    // node 2 gets a heavy (professor-weight) endorsement, node 3 a light one
    const rank = computePageRank([1, 2, 3], [
      { from: 1, to: 2, weight: 3 },
      { from: 1, to: 3, weight: 0.5 },
    ]);
    expect(rank.get('2')).toBeGreaterThan(rank.get('3'));
  });

  it('ignores self-loops and zero/negative weights', () => {
    const rank = computePageRank([1, 2], [
      { from: 1, to: 1, weight: 5 },   // self-loop ignored
      { from: 1, to: 2, weight: 0 },   // zero weight ignored
    ]);
    // with no effective edges, ranks stay uniform
    expect(rank.get('1')).toBeCloseTo(rank.get('2'), 5);
  });
});
