const CollaborationService = require('../../src/services/CollaborationService');
const db = require('../../src/config/db');
const Y = require('yjs');

jest.mock('../../src/config/db', () => ({
  pool: {
    connect: jest.fn()
  },
  query: jest.fn()
}));

describe('CollaborationService Yjs Sync', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    db.pool.connect.mockResolvedValue(mockClient);
    db.query.mockClear();
    jest.clearAllMocks();
  });

  it('should initialize empty doc if not found in db', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 }); // getDocumentState
    
    const stateBinary = await CollaborationService.getDocumentState(1);
    
    const doc = new Y.Doc();
    Y.applyUpdate(doc, stateBinary);
    expect(doc.getText('default').toString()).toBe('');
  });

  it('should merge incoming Yjs update correctly', async () => {
    // Client A creates initial state
    const docA = new Y.Doc();
    const textA = docA.getText('content');
    textA.insert(0, 'Hello');
    const stateA = Y.encodeStateAsUpdate(docA);

    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ content_binary: stateA }] }) // FOR UPDATE
      .mockResolvedValueOnce() // UPDATE
      .mockResolvedValueOnce(); // COMMIT

    // Client B sends an update
    const docB = new Y.Doc();
    Y.applyUpdate(docB, stateA); // B loads A's state
    const textB = docB.getText('content');
    textB.insert(5, ' World');
    
    // Create the update chunk that B sends
    const updateB = Y.encodeStateAsUpdate(docB, Y.encodeStateVector(docA));

    // Service applies B's update
    const mergedState = await CollaborationService.applyUpdate(1, Buffer.from(updateB));

    // Verify merged state
    const mergedDoc = new Y.Doc();
    Y.applyUpdate(mergedDoc, mergedState);
    expect(mergedDoc.getText('content').toString()).toBe('Hello World');
    
    // Verify it was saved to DB
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE collaborative_docs'),
      [expect.any(Buffer), 1]
    );
  });
});
