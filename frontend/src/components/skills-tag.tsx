import React from "react";

interface SkillsTagProps {
  skills: string[];
  onRemove: (skill: string) => void;
}

export function SkillsTag({ skills, onRemove }: SkillsTagProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary"
        >
          {skill}
          <button
            type="button"
            onClick={() => onRemove(skill)}
            className="ml-2 inline-flex items-center p-0.5 rounded-sm hover:bg-primary/20"
          >
            &times;
          </button>
        </span>
      ))}
      {skills.length === 0 && (
        <span className="text-sm text-slate-500 italic">No skills added yet.</span>
      )}
    </div>
  );
}
