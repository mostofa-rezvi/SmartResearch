const db = require('../config/db');
const { emitEvent } = require('../utils/kafkaEmitter');
const logger = require('../utils/logger');

class DiscoveryService {
  async search(userId, query) {
    // 1. Fetch user interest profile
    const userResult = await db.query('SELECT research_interests FROM users WHERE id = $1', [userId]);
    const interests = userResult.rows[0]?.research_interests?.interests || [];

    // 2. Mock Search Results (Elasticsearch placeholder)
    let results = [
      { id: 1, title: 'Deep Learning in Clinical Neuroscience', authors: ['J. Smith', 'A. Doe'], journal: 'Nature Medicine', tier: 'Q1', year: 2024, doi: '10.1038/nm.1234', citations: 142, tags: ['AI', 'Neuroscience'] },
      { id: 2, title: 'Quantum Cryptography Protocols for Finance', authors: ['L. Zhang'], journal: 'Phy. Rev. B', tier: 'Q1', year: 2023, doi: '10.1103/prb.5678', citations: 89, tags: ['Quantum Computing', 'Cryptography'] },
      { id: 3, title: 'The Impact of Social Media on Political Theory', authors: ['E. Burke'], journal: 'APSR', tier: 'Q1', year: 2025, doi: '10.1017/apsr.9012', citations: 12, tags: ['Sociology', 'Political Theory'] },
      { id: 4, title: 'New Algorithms for Edge Computing', authors: ['X. Shen'], journal: 'IEEE Trans', tier: 'Q2', year: 2024, doi: '10.1109/it.3456', citations: 45, tags: ['Algorithms'] },
      { id: 5, title: 'Epidemiological Trends in Urban Environments', authors: ['S. Gupta'], journal: 'The Lancet', tier: 'Q1', year: 2023, doi: '10.1016/lan.7890', citations: 215, tags: ['Epidemiology'] }
    ];

    // Filter results based on query (mock search)
    if (query) {
      results = results.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
    }

    // 3. Personalization Logic with Explainability
    results = results.map(item => {
      const matchEntries = item.tags.filter(tag => interests.includes(tag));
      const matchCount = matchEntries.length;
      const score = matchCount * 10 + (item.tier === 'Q1' ? 5 : 0);
      const matchedInterest = matchCount > 0 ? matchEntries[0] : null;

      return { 
        ...item, 
        score, 
        matchedInterest,
        discovery_reason: matchedInterest 
          ? `Matches your research interest in "${matchedInterest}"` 
          : item.tier === 'Q1' 
            ? 'Highly cited paper in a top-tier journal' 
            : 'Trending in your broader field'
      };
    });

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  async savePaper(userId, paperData) {
    const { title, doi, journal } = paperData;
    
    await db.query(
      'INSERT INTO saved_papers (user_id, paper_title, paper_doi, journal_name) VALUES ($1, $2, $3, $4)',
      [userId, title, doi, journal]
    );

    // Rule #17: Emit Kafka events
    emitEvent('library.paper.saved', `user_${userId}`, { userId, doi, timestamp: new Date().toISOString() });
    
    logger.info({ userId, doi }, 'Paper saved to library');

    return { message: 'Paper saved' };
  }
}

module.exports = new DiscoveryService();
