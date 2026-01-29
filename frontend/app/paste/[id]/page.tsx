"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  FileText,
  AlertTriangle,
  Clock,
  Eye,
  ArrowLeft,
  Copy,
  Check
} from "lucide-react";

type PasteResponse = {
  content: string;
  viewCount: number;
  expiresAt: string | null;
  maxViews: number | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export default function ViewPastePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [paste, setPaste] = useState<PasteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<
    { type: "not_found" | "expired" | "error"; message: string } | null
  >(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/pastes/${id}`);
        setPaste(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching paste:", err);
        if (err.response?.status === 404) {
          setError({ type: "not_found", message: "PASTE_NOT_FOUND" });
        } else if (err.response?.status === 410) {
          setError({ type: "expired", message: "PASTE_EXPIRED" });
        } else {
          setError({ type: "error", message: "FETCH_ERROR" });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  const handleCopyContent = async () => {
    if (!paste) return;
    try {
      await navigator.clipboard.writeText(paste.content);
      setCopied(true);
      toast.success("Content copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy content");
    }
  };

  const formatExpiryDate = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="view-paste-page">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">
              PASTEBIN_LITE
            </h1>
          </div>
          <button
            data-testid="back-home-btn"
            onClick={() => router.push("/")}
            className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold hover:bg-accent hover:text-accent-foreground px-3 py-1 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            New Paste
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]" data-testid="loading-state">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
                Loading...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[50vh]" data-testid="error-state">
            <div className="border border-destructive/50 rounded-sm bg-card p-8 max-w-md w-full text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" strokeWidth={1.5} />
              <div className="space-y-2">
                <p className="font-mono text-lg font-bold text-destructive uppercase tracking-widest">
                  ERROR: {error.message}
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  {error.type === "not_found" &&
                    "This paste does not exist or has been deleted."}
                  {error.type === "expired" &&
                    "This paste has expired and is no longer available."}
                  {error.type === "error" &&
                    "An error occurred while fetching the paste."}
                </p>
              </div>
              <button
                data-testid="create-new-btn"
                onClick={() => router.push("/")}
                className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2"
              >
                Create New Paste
              </button>
            </div>
          </div>
        ) : paste ? (
          <div className="space-y-6" data-testid="paste-content-section">
            <div className="border border-border rounded-sm bg-card p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-2" data-testid="paste-id-display">
                    <FileText className="w-3 h-3" strokeWidth={1.5} />
                    ID: {id}
                  </span>
                  <span className="flex items-center gap-2" data-testid="view-count-display">
                    <Eye className="w-3 h-3" strokeWidth={1.5} />
                    Views: {paste.viewCount}
                    {paste.maxViews && ` / ${paste.maxViews}`}
                  </span>
                  {paste.expiresAt && (
                    <span className="flex items-center gap-2" data-testid="expiry-display">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      Expires: {formatExpiryDate(paste.expiresAt)}
                    </span>
                  )}
                </div>
                <button
                  data-testid="copy-content-btn"
                  onClick={handleCopyContent}
                  className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold border border-input hover:bg-accent hover:text-accent-foreground px-4 py-1 flex items-center"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Content
              </label>
              <div className="border border-border rounded-sm bg-card p-4">
                <pre
                  className="font-mono text-base leading-relaxed whitespace-pre-wrap break-words text-foreground"
                  data-testid="paste-content-display"
                >
                  {paste.content}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <p className="text-xs font-mono text-muted-foreground text-center">
            PASTEBIN_LITE // Ephemeral Text Sharing
          </p>
        </div>
      </footer>
    </div>
  );
}

