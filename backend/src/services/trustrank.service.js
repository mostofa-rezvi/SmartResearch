const db = require('../config/db');
const logger = require('../utils/logger');
const { tierWeight } = require('./trust.service');

/**
 * TrustRank — a PageRank-variant credibility score (Module 5).
 *
 * Credibility propagates through an endorsement graph: when user A upvotes user
 * B's post/comment, or accepts B's answer, an edge A→B is added whose weight is
 * scaled by A's own trust tier (a professor's endorsement carries more weight).
 * Power-iteration PageRank over this graph yields each user's TrustRank, which is
 * normalised to [0,1] and written back to `users.trust_rank`.
 *
 * This runs on the transactional Postgres graph (no external dependency), so it
 * is deterministic and testable — see tests/services/trustrank.service.test.js.
 */

/**
 * Pure power-iteration PageRank.
 * @param {Array<string|number>} nodeIds
 * @param {Array<{from:(string|number), to:(string|number), weight:number}>} edges
 * @param {{damping?:number, iterations?:number}} [opts]
 * @returns {Map<string, number>} nodeId → rank (sums to ~1)
 */
function computePageRank(nodeIds, edges, opts = {}) {
  const damping = opts.damping ?? 0.85;
  const iterations = opts.iterations ?? 40;
  const ids = nodeIds.map(String);
  const N = ids.length;
  if (N === 0) return new Map();

  // out-weight totals and adjacency
  const outWeight = new Map(ids.map((id) => [id, 0]));
  const outEdges = new Map(ids.map((id) => [id, []]));
  for (const e of edges) {
    const from = String(e.from), to = String(e.to);
    const w = e.weight > 0 ? e.weight : 0;
    if (from === to || !outEdges.has(from) || !outWeight.has(to) || w === 0) continue;
    outEdges.get(from).push({ to, w });
    outWeight.set(from, outWeight.get(from) + w);
  }

  let rank = new Map(ids.map((id) => [id, 1 / N]));
  const base = (1 - damping) / N;

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Map(ids.map((id) => [id, base]));
    let dangling = 0;
    for (const id of ids) {
      if (outWeight.get(id) === 0) dangling += rank.get(id);
    }
    // distribute dangling mass uniformly
    const danglingShare = damping * dangling / N;
    for (const id of ids) next.set(id, next.get(id) + danglingShare);

    for (const id of ids) {
      const total = outWeight.get(id);
      if (total === 0) continue;
      const share = damping * rank.get(id);
      for (const { to, w } of outEdges.get(id)) {
        next.set(to, next.get(to) + share * (w / total));
      }
    }
    rank = next;
  }
  return rank;
}

/**
 * Rebuild the endorsement graph from votes + accepted answers and recompute
 * every user's TrustRank, persisting normalised scores to users.trust_rank.
 * @returns {Promise<{users:number, edges:number, updated:number}>}
 */
async function refreshTrustRank() {
  // 1) all users + their tier (tier scales the weight of endorsements they give)
  const usersRes = await db.query('SELECT id, trust_tier FROM users');
  const nodeIds = usersRes.rows.map((r) => r.id);
  const tierOf = new Map(usersRes.rows.map((r) => [String(r.id), r.trust_tier || 'unverified']));
  if (nodeIds.length === 0) return { users: 0, edges: 0, updated: 0 };

  const edges = [];

  // 2) post upvotes → edge voter → post author
  const postVotes = await db.query(`
    SELECT v.user_id AS voter, p.user_id AS author
    FROM votes v JOIN community_posts p ON v.post_id = p.id
    WHERE v.value > 0 AND v.post_id IS NOT NULL AND v.user_id <> p.user_id
  `);
  for (const r of postVotes.rows) {
    edges.push({ from: r.voter, to: r.author, weight: tierWeight(tierOf.get(String(r.voter))) });
  }

  // 3) comment upvotes → edge voter → comment author
  const commentVotes = await db.query(`
    SELECT v.user_id AS voter, c.user_id AS author
    FROM votes v JOIN comments c ON v.comment_id = c.id
    WHERE v.value > 0 AND v.comment_id IS NOT NULL AND v.user_id <> c.user_id
  `);
  for (const r of commentVotes.rows) {
    edges.push({ from: r.voter, to: r.author, weight: tierWeight(tierOf.get(String(r.voter))) });
  }

  // 4) accepted answers → strong edge (asker → answerer), weight 3x tier
  const accepted = await db.query(`
    SELECT p.user_id AS asker, c.user_id AS answerer
    FROM comments c JOIN community_posts p ON c.post_id = p.id
    WHERE c.is_accepted = TRUE AND p.user_id <> c.user_id
  `);
  for (const r of accepted.rows) {
    edges.push({ from: r.asker, to: r.answerer, weight: 3 * tierWeight(tierOf.get(String(r.asker))) });
  }

  // 5) PageRank + normalise to [0,1] by max
  const rank = computePageRank(nodeIds, edges);
  const maxRank = Math.max(1e-12, ...Array.from(rank.values()));

  // 6) persist
  let updated = 0;
  for (const id of nodeIds) {
    const norm = (rank.get(String(id)) || 0) / maxRank;
    await db.query('UPDATE users SET trust_rank = $1 WHERE id = $2', [norm.toFixed(6), id]);
    updated++;
  }

  logger.info(`[TrustRank] recomputed: ${nodeIds.length} users, ${edges.length} endorsement edges`);
  return { users: nodeIds.length, edges: edges.length, updated };
}

module.exports = { computePageRank, refreshTrustRank };
