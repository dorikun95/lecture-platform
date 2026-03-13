"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Loader2, CheckCircle } from "lucide-react";

interface UploadedFile {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface FileUploaderProps {
  onUpload: (file: UploadedFile) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUploader({
  onUpload,
  accept,
  multiple,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    return res.json();
  };

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const result = await uploadFile(fileList[i]);
        if (result.url) {
          uploaded.push(result);
          onUpload(result);
        }
      } catch {
        // skip failed files
      }
    }

    setFiles((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer hover:border-neutral-500 hover:bg-neutral-50/30 transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        {uploading ? (
          <Loader2 className="w-10 h-10 animate-spin text-neutral-900 mx-auto" />
        ) : (
          <>
            <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm text-neutral-600 font-medium">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              PDF, PPTX, DOCX, 이미지, 코드 파일
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-lg text-sm"
            >
              <File className="w-4 h-4 text-neutral-400" />
              <span className="flex-1 text-neutral-700 truncate">
                {f.fileName}
              </span>
              <span className="text-xs text-neutral-400">
                {(f.fileSize / 1024).toFixed(1)}KB
              </span>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <button
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="p-0.5 hover:bg-neutral-200 rounded"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
