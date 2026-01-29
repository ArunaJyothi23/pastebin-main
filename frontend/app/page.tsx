"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Clock, Eye, Copy, Check } from "lucide-react";

const EXPIRY_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "10 Minutes", value: "600" },
  { label: "1 Hour", value: "3600" },
  { label: "1 Day", value: "86400" },
  { label: "1 Week", value: "604800" }
];

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export default function HomePage() {
  const [content, setContent] = useState("");
  const [expiresIn, setExpiresIn] = useState("never");
  const [maxViews, setMaxViews] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdPaste, setCreatedPaste] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreatePaste = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload: {
        content: string;
        ttl_seconds?: number;
        max_views?: number;
      } = {
        content
      };

      if (expiresIn !== "never") {
        payload.ttl_seconds = parseInt(expiresIn, 10);
      }

      if (maxViews && parseInt(maxViews, 10) > 0) {
        payload.max_views = parseInt(maxViews, 10);
      }

      const response = await axios.post(`${API_BASE}/api/pastes`, payload);
      setCreatedPaste(response.data);
      toast.success("Paste created successfully!");
    } catch (error: any) {
      console.error("Error creating paste:", error);
      toast.error(error.response?.data?.detail || "Failed to create paste");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdPaste) return;

    const fullUrl = `${window.location.origin}/p/${createdPaste.id}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNewPaste = () => {
    setContent("");
    setExpiresIn("never");
    setMaxViews("");
    setCreatedPaste(null);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">
              PASTEBIN_LITE
            </h1>
          </div>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Ephemeral Text Sharing
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!createdPaste ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Paste Content
              </label>
              <div className="border border-border rounded-sm bg-card p-4">
                <textarea
                  data-testid="paste-content-input"
                  placeholder="// Paste your text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[50vh] font-mono resize-none bg-transparent border-none focus:outline-none text-base leading-relaxed placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="border border-border rounded-sm bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="space-y-2 w-full sm:w-48">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    Expires In
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full font-mono text-sm rounded-sm border border-input bg-background px-2 py-1"
                  >
                    {EXPIRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 w-full sm:w-40">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Eye className="w-3 h-3" strokeWidth={1.5} />
                    Max Views
                  </label>
                  <input
                    data-testid="max-views-input"
                    type="number"
                    placeholder="Unlimited"
                    min={1}
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    className="w-full font-mono text-sm rounded-sm border border-input bg-background px-2 py-1"
                  />
                </div>

                <div className="flex-1 flex justify-end w-full sm:w-auto">
                  <button
                    data-testid="create-paste-btn"
                    onClick={handleCreatePaste}
                    disabled={isLoading || !content.trim()}
                    className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2 disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Create Paste"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6" data-testid="paste-created-section">
            <div className="border border-primary/50 rounded-sm bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-sm uppercase tracking-widest text-primary">
                  Paste Created Successfully
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    data-testid="shareable-link-input"
                    readOnly
                    value={`${window.location.origin}/p/${createdPaste.id}`}
                    className="font-mono text-sm rounded-sm border border-input bg-background flex-1 px-2 py-1"
                  />
                  <button
                    data-testid="copy-link-btn"
                    onClick={handleCopyLink}
                    className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold border border-input hover:bg-accent hover:text-accent-foreground px-4 py-1"
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

              <div className="pt-4 border-t border-border">
                <button
                  data-testid="new-paste-btn"
                  onClick={handleNewPaste}
                  className="rounded-sm font-mono uppercase tracking-widest text-xs font-bold hover:bg-accent hover:text-accent-foreground px-4 py-1"
                >
                  Create Another Paste
                </button>
              </div>
            </div>
          </div>
        )}
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

