const libraryService = require('../services/library.service');

const searchJournals = async (req, res) => {
  try {
    const results = await libraryService.searchJournals(req.query);
    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Library search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search journals'
    });
  }
};

const getLibraryMetadata = async (req, res) => {
  try {
    const metadata = await libraryService.getMetadata();
    res.json({
      status: 'success',
      data: metadata
    });
  } catch (error) {
    console.error('Library metadata error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch library metadata'
    });
  }
};

module.exports = {
  searchJournals,
  getLibraryMetadata
};
