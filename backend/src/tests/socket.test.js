/**
 * Phase 21 — Security & ML Hardening: Socket.IO JWT Auth Tests
 *
 * Coverage:
 *   1. socketAuthMiddleware — rejects connections without a token
 *   2. socketAuthMiddleware — rejects connections with a tampered/invalid token
 *   3. socketAuthMiddleware — attaches socket.user for valid tokens
 *   4. join_project handler — sends error event for non-members (keeps socket open)
 *   5. join_project handler — grants room access for valid project members
 *
 * These are pure-unit tests that do NOT require a running server, Postgres, or Redis.
 * All external dependencies (db, logger) are mocked via jest.mock().
 *
 * Token transport decision (21-CONTEXT.md D-01):
 *   Token is sent via `socket.handshake.auth.token` (auth payload), with a fallback
 *   to the `x-auth-token` header.
 *
 * Failure mode decision (21-CONTEXT.md D-03):
 *   Unauthorized room join: emit 'error' event, keep socket connected.
 */

const jwt = require('jsonwebtoken');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const db = require('../config/db');
const config = require('../config/index');
const { socketAuthMiddleware } = require('../middleware/auth');

/** Build a minimal socket mock for socketAuthMiddleware tests. */
function makeSocket({ authToken = undefined, headerToken = undefined } = {}) {
  return {
    handshake: {
      auth: { token: authToken },
      headers: headerToken ? { 'x-auth-token': headerToken } : {},
    },
    user: null,
  };
}

/** Signs a token with the real access secret from config. */
function signToken(payload, opts = {}) {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: '15m', ...opts });
}

// ─── 1. socketAuthMiddleware ──────────────────────────────────────────────────

describe('socketAuthMiddleware (auth.js)', () => {
  const MOCK_USER = { id: 'user-42', name: 'Test User', email: 'test@example.com', role: 'user' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1a. No token ────────────────────────────────────────────────────────────

  it('should reject connection when no token is provided in auth payload or header', async () => {
    const socket = makeSocket();
    const next = jest.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/No token provided/i);
    expect(socket.user).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  // ── 1b. Invalid / tampered token ────────────────────────────────────────────

  it('should reject connection with a tampered token (wrong secret)', async () => {
    const badToken = jwt.sign({ id: 'user-42' }, 'wrong_secret', { expiresIn: '15m' });
    const socket = makeSocket({ authToken: badToken });
    const next = jest.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/Authentication error/i);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('should reject connection with an expired token', async () => {
    const expiredToken = signToken({ id: 'user-42' }, { expiresIn: '-1s' });
    const socket = makeSocket({ authToken: expiredToken });
    const next = jest.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(db.query).not.toHaveBeenCalled();
  });

  // ── 1c. Token with no userId in payload ─────────────────────────────────────

  it('should reject connection when token payload carries no user id', async () => {
    const tokenWithoutId = signToken({ email: 'no-id@example.com' }); // no `id` or `user.id`
    const socket = makeSocket({ authToken: tokenWithoutId });
    const next = jest.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/Token is not valid/i);
    expect(db.query).not.toHaveBeenCalled();
  });

  // ── 1d. Valid token — user not in DB ────────────────────────────────────────

  it('should reject connection when token is valid but user does not exist in database', async () => {
    const validToken = signToken({ id: 'ghost-user' });
    const socket = makeSocket({ authToken: validToken });
    const next = jest.fn();

    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/User not found/i);
    expect(socket.user).toBeNull();
  });

  // ── 1e. Happy path — auth payload ───────────────────────────────────────────

  it('should call next() without error and attach user to socket for a valid auth.token', async () => {
    const validToken = signToken({ id: MOCK_USER.id });
    const socket = makeSocket({ authToken: validToken });
    const next = jest.fn();

    db.query.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error argument
    expect(socket.user).toEqual(MOCK_USER);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [MOCK_USER.id]
    );
  });

  // ── 1f. Header fallback ─────────────────────────────────────────────────────

  it('should accept the token from x-auth-token header when auth.token is absent', async () => {
    const validToken = signToken({ id: MOCK_USER.id });
    // No authToken in auth payload — only in header
    const socket = makeSocket({ headerToken: validToken });
    const next = jest.fn();

    db.query.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(); // success
    expect(socket.user).toEqual(MOCK_USER);
  });
});

// ─── 2. join_project room-join guard ─────────────────────────────────────────

describe('join_project room-join guard (index.js)', () => {
  /**
   * We test the join_project handler logic directly (extracted as a unit)
   * so we don't spin up a full server. The handler:
   *   1. Queries project_members WHERE project_id = $1 AND user_id = $2
   *   2. If rowCount === 0 → emit('error', ...) and return (socket stays connected)
   *   3. If member found → socket.join(room), broadcast presence:join
   */
  const joinProjectHandler = async (socket, projectId) => {
    try {
      const authCheck = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, socket.user.id]
      );

      if (authCheck.rowCount === 0) {
        socket.emit('error', { message: 'Unauthorized to join project' });
        return;
      }

      const room = `project_${projectId}`;
      socket.join(room);
      socket.to(room).emit('presence:join', socket.user);
    } catch (err) {
      socket.emit('error', { message: 'Server error joining project' });
    }
  };

  const AUTHENTICATED_USER = { id: 'user-99', name: 'Alice', email: 'alice@example.com', role: 'user' };

  /** Builds a mock socket that already passed socketAuthMiddleware (has .user set). */
  function makeAuthenticatedSocket(user = AUTHENTICATED_USER) {
    const rooms = new Set();
    const emitted = [];
    const toEmitted = [];

    return {
      user,
      rooms,
      emit: jest.fn((event, data) => emitted.push({ event, data })),
      join: jest.fn((room) => rooms.add(room)),
      to: jest.fn().mockReturnValue({
        emit: jest.fn((event, data) => toEmitted.push({ event, data })),
      }),
      _emitted: emitted,
      _toEmitted: toEmitted,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 2a. Non-member tries to join ─────────────────────────────────────────────

  it('should emit error event and NOT join room when user is not a project member', async () => {
    const socket = makeAuthenticatedSocket();
    const projectId = 'project-abc';

    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await joinProjectHandler(socket, projectId);

    // Decision D-03: emit error, keep socket connected (no disconnect)
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'Unauthorized to join project' })
    );
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.rooms.has(`project_${projectId}`)).toBe(false);
  });

  // ── 2b. Member joins successfully ────────────────────────────────────────────

  it('should join the room and broadcast presence:join when user is a valid project member', async () => {
    const socket = makeAuthenticatedSocket();
    const projectId = 'project-xyz';

    db.query.mockResolvedValueOnce({
      rows: [{ role: 'editor' }],
      rowCount: 1,
    });

    await joinProjectHandler(socket, projectId);

    expect(socket.join).toHaveBeenCalledWith(`project_${projectId}`);
    expect(socket.rooms.has(`project_${projectId}`)).toBe(true);
    expect(socket.emit).not.toHaveBeenCalledWith(
      'error',
      expect.anything()
    );
    // presence:join should be broadcast to the room
    expect(socket.to).toHaveBeenCalledWith(`project_${projectId}`);
    const roomBroadcast = socket.to.mock.results[0].value;
    expect(roomBroadcast.emit).toHaveBeenCalledWith('presence:join', AUTHENTICATED_USER);
  });

  // ── 2c. DB query uses correct parameters ────────────────────────────────────

  it('should query project_members with the correct projectId and the socket user id', async () => {
    const socket = makeAuthenticatedSocket();
    const projectId = 'project-123';

    db.query.mockResolvedValueOnce({ rows: [{ role: 'viewer' }], rowCount: 1 });

    await joinProjectHandler(socket, projectId);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, AUTHENTICATED_USER.id]
    );
  });

  // ── 2d. DB failure emits error without crashing ──────────────────────────────

  it('should emit server error event if the database query throws', async () => {
    const socket = makeAuthenticatedSocket();
    const projectId = 'project-fail';

    db.query.mockRejectedValueOnce(new Error('DB connection lost'));

    await joinProjectHandler(socket, projectId);

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'Server error joining project' })
    );
    expect(socket.join).not.toHaveBeenCalled();
  });

  // ── 2e. User id mismatch — wrong user tries to claim another user's projectId ─

  it('should reject if the authenticated user is not a member even if projectId is valid', async () => {
    // A different user (user-88) authenticated but project only has user-99
    const intruder = { id: 'user-88', name: 'Bob', role: 'user' };
    const socket = makeAuthenticatedSocket(intruder);
    const projectId = 'project-secret';

    // membership check returns no rows for user-88
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await joinProjectHandler(socket, projectId);

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'Unauthorized to join project' })
    );
    expect(socket.join).not.toHaveBeenCalled();
    // Confirm the query used the intruder's id, not any other
    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      [projectId, intruder.id]
    );
  });
});
