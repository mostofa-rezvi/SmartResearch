const MilestoneService = require('../../../src/services/MilestoneService');
const db = require('../../../src/config/db');

jest.mock('../../../src/config/db', () => ({
  query: jest.fn()
}));

describe('MilestoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus FSM', () => {
    it('should allow valid transition from TODO to IN_PROGRESS', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'TODO', project_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'IN_PROGRESS' }] });

      const res = await MilestoneService.updateStatus(1, 100, 'IN_PROGRESS');
      expect(res.status).toBe('IN_PROGRESS');
    });

    it('should reject invalid transition from TODO to DONE', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'TODO', project_id: 1 }] });

      await expect(MilestoneService.updateStatus(1, 100, 'DONE')).rejects.toThrow('Invalid transition');
    });

    it('should allow Admin to transition to DONE from REVIEW', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'REVIEW', project_id: 1 }] }) // status
        .mockResolvedValueOnce({ rows: [{ role: 'admin' }] }) // admin check
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'DONE' }] }); // update

      const res = await MilestoneService.updateStatus(1, 100, 'DONE');
      expect(res.status).toBe('DONE');
    });

    it('should reject non-Admin transitioning to DONE', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'REVIEW', project_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ role: 'member' }] }); // member check

      await expect(MilestoneService.updateStatus(1, 100, 'DONE')).rejects.toThrow('Only admins');
    });
  });
});
