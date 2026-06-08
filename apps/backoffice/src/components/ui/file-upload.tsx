import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filesService, ACCEPTED_TYPES, MAX_SIZE_BYTES } from '@/services/files.service';

interface FileUploadProps {
  value?: string;           // minio: key stored in DB (or legacy http URL)
  onChange: (key: string | null) => void;
  uploadContext?: { huntId?: string; stepId?: string };
  accept?: string[];
  label?: string;
  className?: string;
}

export default function FileUpload({
  value,
  onChange,
  uploadContext,
  accept = ACCEPTED_TYPES,
  label = 'Cliquer ou déposer un fichier',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isPdf = value?.endsWith('.pdf');
  const isImage = value && !isPdf;

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Type non supporté. Formats acceptés : JPEG, PNG, GIF, WebP, PDF.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Fichier trop volumineux (max 10 Mo).');
      return;
    }

    setIsUploading(true);
    try {
      const result = await filesService.upload(file, uploadContext);
      setPreviewUrl(result.presignedUrl);
      onChange(result.key);
    } catch {
      setError("Échec de l'upload. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  }

  const resolvePreview = useCallback(async (): Promise<string | null> => {
    if (previewUrl) return previewUrl;
    if (!value) return null;
    if (value.startsWith('http')) return value;
    try {
      const url = await filesService.getPresignedUrl(value);
      setPreviewUrl(url);
      return url;
    } catch {
      return null;
    }
  }, [previewUrl, value]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleClear() {
    setError(null);
    setPreviewUrl(null);
    onChange(null);
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          {isImage ? (
            <ImagePreview resolve={resolvePreview} />
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50">
              <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{value.split('/').pop()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full bg-white border border-gray-200 p-1 shadow-sm hover:bg-gray-50 transition-colors"
            title="Supprimer"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'w-full rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            isUploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isUploading
            ? <Loader2 className="mx-auto h-6 w-6 text-gray-400 animate-spin" />
            : <Upload className="mx-auto h-6 w-6 text-gray-400" />}
          <p className="mt-2 text-sm text-gray-500">
            {isUploading ? 'Upload en cours…' : label}
          </p>
          <p className="mt-1 text-xs text-gray-400">JPEG, PNG, GIF, WebP, PDF — 10 Mo max</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="hidden"
        onChange={handleChange}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ImagePreview({ resolve }: { resolve: () => Promise<string | null> }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolve().then((url) => {
      if (!cancelled) setSrc(url);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [resolve]);

  if (failed) return (
    <div className="w-full h-24 flex items-center justify-center bg-gray-50 text-xs text-gray-400">
      Impossible de charger l'aperçu
    </div>
  );

  return src
    ? <img src={src} alt="Aperçu" className="w-full max-h-48 object-contain bg-gray-50 rounded" />
    : <div className="w-full h-24 bg-gray-100 animate-pulse rounded" />;
}
