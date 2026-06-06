const ProjectService = require('../../src/services/ProjectService');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  pool: {
    connect: jest.fn()
  },
  query: jest.fn()
}));

describe('ProjectService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    db.pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project, assign admin, and init doc', async () => {
      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test' }] }) // INSERT project
        .mockResolvedValueOnce() // INSERT member
        .mockResolvedValueOnce() // INSERT doc
        .mockResolvedValueOnce(); // COMMIT

      const project = await ProjectService.createProject(100, { name: 'Test', description: 'Desc' });
      
      expect(project.id).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO project_members'),
        [1, 100, 'admin']
      );
    });

    it('should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockRejectedValueOnce(new Error('DB Error')); // fail INSERT

      await expect(ProjectService.createProject(100, {})).rejects.toThrow('DB Error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('inviteMember', () => {
    it('should allow admin to invite member', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'admin' }] }) // admin check
        .mockResolvedValueOnce(); // insert

      const result = await ProjectService.inviteMember(1, 100, 200, 'member');
      expect(result.success).toBe(true);
    });

    it('should throw if non-admin tries to invite', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'member' }] }); // Not admin

      await expect(ProjectService.inviteMember(1, 100, 200)).rejects.toThrow('Only admins can invite');
    });
  });
});
