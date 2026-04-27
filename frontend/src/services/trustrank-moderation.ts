export function evaluateSpam(content: string, authorTrustRank: number) {
  // Spam heuristics
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  const isSuspicious = linkCount > 3 || content.includes('buy now') || content.includes('cheap');
  
  // If TrustRank is low and content is suspicious, flag as spam
  if (authorTrustRank < 10 && isSuspicious) {
    return { isSpam: true, reason: 'Low TrustRank and suspicious content' };
  }
  
  return { isSpam: false };
}
