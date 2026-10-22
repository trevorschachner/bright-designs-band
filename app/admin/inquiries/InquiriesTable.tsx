import type { InquiryRow } from '@/lib/services/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CopyEmailButton, InquiryMessage } from './InquiryCells';

/**
 * Attio search for an email. The URL pattern is a best guess (Attio documents
 * no stable deep-link for search); the Copy email button is the fallback.
 */
export function attioSearchUrl(email: string): string {
  return `https://app.attio.com/bright-designs/search?q=${encodeURIComponent(email)}`;
}

/** Only Attio's own record links are rendered as links. */
function attioRecordHref(url: string | null): string | null {
  return url?.startsWith('https://app.attio.com/') ? url : null;
}

/** A stored trace URL as a link target: in-site paths and http(s) pages only. */
function traceHref(url: string): string | null {
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return /^https?:\/\//.test(url) ? url : null;
}

function TraceLink({ url }: { url: string }) {
  const href = traceHref(url);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="break-all hover:underline">{url}</a>
  ) : (
    <span className="break-all">{url}</span>
  );
}

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });

function formatDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : dateFormat.format(time);
}

/** One table row; exported for the page test. */
export function InquiryTableRow({ row }: { row: InquiryRow }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap align-top">
        <time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>
      </TableCell>
      <TableCell className="align-top">
        {row.name || '—'}
        {row.school && <div className="text-xs text-muted-foreground">{row.school}</div>}
      </TableCell>
      <TableCell className="align-top">
        <a href={`mailto:${row.email}`} className="break-all hover:underline">{row.email}</a>
      </TableCell>
      <TableCell className="align-top">{row.service || '—'}</TableCell>
      <TableCell className="align-top max-w-[16rem] text-sm">
        {row.pageUrl ? <TraceLink url={row.pageUrl} /> : <span className="text-muted-foreground">—</span>}
        {row.referrerUrl && (
          <div className="mt-1 text-xs text-muted-foreground">
            from <TraceLink url={row.referrerUrl} />
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">{row.source}</div>
      </TableCell>
      <TableCell className="align-top"><InquiryMessage message={row.message} /></TableCell>
      <TableCell className="align-top">
        <div className="flex flex-col items-start gap-2">
          <CopyEmailButton email={row.email} />
          {attioRecordHref(row.attioRecordUrl) ? (
            <a href={attioRecordHref(row.attioRecordUrl)!} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              Open in Attio
            </a>
          ) : (
            <>
              {row.attioError && (
                <span className="text-xs text-destructive" title={row.attioError}>Attio sync failed</span>
              )}
              <a href={attioSearchUrl(row.email)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Search Attio
              </a>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function InquiriesTable({ rows }: { rows: InquiryRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Sent from</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Follow up</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => <InquiryTableRow key={row.id} row={row} />)}
      </TableBody>
    </Table>
  );
}
