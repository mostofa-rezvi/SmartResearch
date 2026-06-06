export class ChecklistService {
  static getTemplates() {
    return [
      { id: 'ieee-conf', name: 'IEEE Conference Template', url: '/templates/ieee.docx' },
      { id: 'apa-style', name: 'APA Style Template', url: '/templates/apa.docx' },
      { id: 'nature-article', name: 'Nature Article Template', url: '/templates/nature.docx' },
      { id: 'acm-style', name: 'ACM Style Template', url: '/templates/acm.docx' },
    ];
  }

  static async getUserChecklist(userId: string) {
    return [
      { id: '1', task: 'Abstract and Keywords', status: 'done' },
      { id: '2', task: 'Conflict of Interest Statement', status: 'pending' },
      { id: '3', task: 'Ethics Committee Approval', status: 'pending' },
      { id: '4', task: 'Data Availability Statement', status: 'done' },
    ];
  }
}
