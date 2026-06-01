import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { getApiErrorMessageAsync } from '../../utils/apiError';
import { ModalShell } from '../ui/ModalShell';

type Props = {
  applicationId: string;
  className?: string;
};

function parseFilename(contentDisposition: string | undefined): string {
  if (!contentDisposition) {
    return 'cv';
  }
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? 'cv';
}

function isPdfBlob(blob: Blob, headerMime: string, filename: string): boolean {
  const mime = (blob.type || headerMime || '').toLowerCase();
  if (mime.includes('pdf')) {
    return true;
  }
  return filename.toLowerCase().endsWith('.pdf');
}

export function CvViewButton({ applicationId, className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('cv.pdf');
  const pdfUrlRef = useRef<string | null>(null);

  const revokeStoredUrl = () => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    setPdfUrl(null);
  };

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const closePdf = () => {
    setPdfOpen(false);
    revokeStoredUrl();
  };

  const loadCv = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/applications/${applicationId}/cv`, {
        responseType: 'blob',
      });
      const raw = res.data as Blob;
      if (!raw.size) {
        setError('CV file is empty or missing on the server.');
        return;
      }
      const headerMime = (res.headers['content-type'] as string | undefined) ?? '';
      const name = parseFilename(res.headers['content-disposition'] as string | undefined);
      const blob =
        raw.type || !headerMime
          ? raw
          : new Blob([raw], { type: headerMime.split(';')[0]?.trim() || raw.type });

      const url = URL.createObjectURL(blob);

      if (isPdfBlob(blob, headerMime, name)) {
        revokeStoredUrl();
        pdfUrlRef.current = url;
        setDownloadName(name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`);
        setPdfUrl(url);
        setPdfOpen(true);
      } else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(await getApiErrorMessageAsync(e, 'Could not open CV.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className || undefined}>
      <button
        type="button"
        className="btn-secondary shrink-0"
        disabled={loading}
        onClick={() => void loadCv()}
      >
        {loading ? 'Opening…' : 'View CV'}
      </button>
      {error && (
        <p className="mt-2 max-w-md text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
      <ModalShell
        open={pdfOpen}
        titleId="cv-pdf-title"
        title="Candidate CV"
        onClose={closePdf}
        maxWidthClass="max-w-5xl"
        contentClassName="!max-h-[min(78vh,820px)] !overflow-hidden p-0"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={closePdf}>
              Close
            </button>
            {pdfUrl && (
              <a className="btn-primary" href={pdfUrl} download={downloadName}>
                Download PDF
              </a>
            )}
          </div>
        }
      >
        {pdfUrl ? (
          <iframe
            title="CV preview"
            src={pdfUrl}
            className="block h-[min(78vh,820px)] w-full bg-white"
          />
        ) : null}
      </ModalShell>
    </div>
  );
}
