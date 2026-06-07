const notificationService = require('../../src/services/notification.service');
const db = require('../../src/config/db');
const eventBus = require('../../src/services/eventBus.service');
const { sendMail } = require('../../src/services/email.service');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/services/eventBus.service', () => ({
  emitEvent: jest.fn()
}));

jest.mock('../../src/services/email.service', () => ({
  sendMail: jest.fn()
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notify', () => {
    it('should enqueue notification event to eventBus', async () => {
      eventBus.emitEvent.mockResolvedValue('msg-123');

      await notificationService.notify(
        1,
        'test_type',
        'Test Title',
        'Test Body',
        { ref: 456 },
        'test@example.com',
        { subject: 'Mail Sub', html: '<p>Mail</p>' }
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith('notification.events', {
        userId: 1,
        type: 'test_type',
        title: 'Test Title',
        body: 'Test Body',
        meta: { ref: 456 },
        recipientEmail: 'test@example.com',
        emailTemplate: { subject: 'Mail Sub', html: '<p>Mail</p>' }
      });
    });
  });

  describe('processNotify', () => {
    it('should insert notification into DB, emit via Socket.IO, and send mail', async () => {
      const mockCreatedRow = { id: 99, user_id: 1, type: 'test_type', title: 'Test Title', body: 'Test Body', meta: { ref: 456 } };
      db.query.mockResolvedValue({ rows: [mockCreatedRow] });

      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      notificationService.init(mockIo);

      await notificationService.processNotify({
        userId: 1,
        type: 'test_type',
        title: 'Test Title',
        body: 'Test Body',
        meta: { ref: 456 },
        recipientEmail: 'test@example.com',
        emailTemplate: { subject: 'Mail Sub', html: '<p>Mail</p>' }
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        [1, 'test_type', 'Test Title', 'Test Body', JSON.stringify({ ref: 456 })]
      );
      expect(mockIo.to).toHaveBeenCalledWith('user_1');
      expect(mockIo.emit).toHaveBeenCalledWith('notification:new', mockCreatedRow);
      expect(sendMail).toHaveBeenCalledWith('test@example.com', 'Mail Sub', '<p>Mail</p>');
    });
  });
});
