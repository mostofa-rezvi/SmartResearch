const axios = require('axios');

exports.resolveDoi = async (req, res) => {
  try {
    let { doi } = req.query;

    if (!doi) {
      return res.status(400).json({
        success: false,
        message: 'DOI parameter is required',
      });
    }

    // Clean up DOI (remove doi.org prefix if exists)
    doi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '');
    doi = doi.trim();

    console.log(`Resolving DOI via OpenAlex: ${doi}`);

    // Call OpenAlex API
    const openAlexUrl = `https://api.openalex.org/works/doi:${doi}`;
    const response = await axios.get(openAlexUrl, {
      headers: {
        'User-Agent': 'SmartResearch/1.0 (mailto:support@smartresearch.com)'
      }
    });

    const work = response.data;

    // Standardize the response data for our frontend
    const paperMetadata = {
      id: work.id,
      doi: work.doi ? work.doi.replace('https://doi.org/', '') : doi,
      title: work.title,
      publication_year: work.publication_year,
      publication_date: work.publication_date,
      authors: work.authorships ? work.authorships.map(a => ({
        name: a.author.display_name,
        institutions: a.institutions ? a.institutions.map(i => i.display_name) : []
      })) : [],
      abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : null,
      journal: work.primary_location && work.primary_location.source ? work.primary_location.source.display_name : null,
      is_open_access: work.open_access ? work.open_access.is_oa : false,
      oa_url: work.open_access ? work.open_access.oa_url : null,
      citation_count: work.cited_by_count,
      concepts: work.concepts ? work.concepts.map(c => ({
        display_name: c.display_name,
        score: c.score
      })) : []
    };

    res.status(200).json({
      success: true,
      data: paperMetadata,
    });
  } catch (error) {
    console.error('Error resolving DOI:', error.response?.data || error.message);
    
    // Check if it's a 404 from OpenAlex
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'DOI not found in OpenAlex database.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to resolve DOI',
      error: error.message,
    });
  }
};

// Helper function to reconstruct abstract from inverted index (OpenAlex format)
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const wordIndex = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordIndex.push({ word, pos });
    }
  }
  wordIndex.sort((a, b) => a.pos - b.pos);
  return wordIndex.map(w => w.word).join(' ');
}
