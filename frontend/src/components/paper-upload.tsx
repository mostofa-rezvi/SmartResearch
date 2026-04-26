import React, { useRef } from "react";
import { Upload } from "lucide-react";

interface PaperUploadProps {
  onUpload: (file: File) => void;
}

export function PaperUpload({ onUpload }: PaperUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <Upload className="w-8 h-8 text-slate-400" />
      <div className="text-center">
        <p className="text-sm font-medium">Click to upload a research paper</p>
        <p className="text-xs text-slate-500">PDF, up to 10MB</p>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
    </div>
  );
}
