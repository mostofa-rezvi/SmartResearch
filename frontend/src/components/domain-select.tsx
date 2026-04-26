import React from "react";

interface DomainSelectProps {
  selectedDomains: string[];
  onChange: (domains: string[]) => void;
}

const AVAILABLE_DOMAINS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Computer Vision",
  "Natural Language Processing",
  "Robotics",
  "Data Science",
  "Bioinformatics",
  "Quantum Computing"
];

export function DomainSelect({ selectedDomains, onChange }: DomainSelectProps) {
  const handleToggle = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      onChange(selectedDomains.filter(d => d !== domain));
    } else {
      onChange([...selectedDomains, domain]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Research Domains</label>
      <div className="flex flex-col gap-2 p-4 border rounded-2xl bg-white dark:bg-slate-900/50">
        {AVAILABLE_DOMAINS.map(domain => (
          <label key={domain} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedDomains.includes(domain)}
              onChange={() => handleToggle(domain)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-sm">{domain}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
