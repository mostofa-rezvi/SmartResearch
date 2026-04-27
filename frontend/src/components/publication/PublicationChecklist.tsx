import React from 'react';

export const PublicationChecklist = ({ checklist, templates }: { checklist: any[], templates: any[] }) => {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Submission Checklist</h2>
        <div className="bg-white rounded-lg border divide-y">
          {checklist.map(item => (
            <div key={item.id} className="p-4 flex items-center gap-4">
              <input type="checkbox" checked={item.status === 'done'} readOnly className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className={item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}>
                {item.task}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Paper Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map(template => (
            <a key={template.id} href={template.url} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
              <span className="flex-1 font-medium">{template.name}</span>
              <span className="text-blue-600 text-sm">Download</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
