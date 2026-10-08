'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const PREVIEW_CHARS = 120;

/** The first PREVIEW_CHARS characters, cut at a word when one is close, plus an ellipsis. */
export function previewOf(message: string): string {
  const text = message.trim();
  if (text.length <= PREVIEW_CHARS) return text;
  const cut = text.slice(0, PREVIEW_CHARS);
  const space = cut.lastIndexOf(' ');
  return `${(space > PREVIEW_CHARS - 20 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Message preview with an inline "Show all" / "Show less" toggle. */
export function InquiryMessage({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  const text = message.trim();
  if (!text) return <span className="text-muted-foreground">(no message)</span>;
  const long = text.length > PREVIEW_CHARS;
  return (
    <div className="max-w-md">
      <p className="whitespace-pre-wrap break-words">{open || !long ? text : previewOf(text)}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {open ? 'Show less' : 'Show all'}
        </button>
      )}
    </div>
  );
}

/** Copies the address; the reliable fallback when the Attio link does not land on the person. */
export function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2000);
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`Copy ${email}`}>
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy email'}
    </Button>
  );
}
