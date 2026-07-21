/**
 * Legacy recommendation service — verifies it delegates to the single source of
 * truth (DiscoveryService.getRecommendationsFromOnboarding) instead of the old
 * broken user_/post_-prefixed hydration path (regression guard for audit G3/G10).
 */
const discoveryService = require('../../src/services/discovery.service');
const recommendationService = require('../../src/services/recommendationService');

jest.mock('../../src/services/discovery.service', () => ({
  getRecommendationsFromOnboarding: jest.fn(),
}));

describe('RecommendationService (legacy /api/v1/recommendations)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates to DiscoveryService.getRecommendationsFromOnboarding with the userId', async () => {
    const hydrated = [
      { id: 'A5023888391', name: 'Ada Lovelace', similarityScore: 92, internalUserId: 7 },
    ];
    discoveryService.getRecommendationsFromOnboarding.mockResolvedValue(hydrated);

    const result = await recommendationService.getRecommendations(42);

    expect(discoveryService.getRecommendationsFromOnboarding).toHaveBeenCalledWith(42);
    expect(result).toBe(hydrated);
    // Contract check: researcher_profiles string IDs, not raw DOIs as titles
    expect(typeof result[0].id).toBe('string');
    expect(result[0]).toHaveProperty('similarityScore');
  });

  it('propagates errors from the discovery service', async () => {
    discoveryService.getRecommendationsFromOnboarding.mockRejectedValue(new Error('ml down'));
    await expect(recommendationService.getRecommendations(1)).rejects.toThrow('ml down');
  });
});
