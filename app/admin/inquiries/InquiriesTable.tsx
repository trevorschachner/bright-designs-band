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
      <TableCell className="align-top">{row.name || '—'}</TableCell>
      <TableCell className="align-top">
        <a href={`mailto:${row.email}`} className="break-all hover:underline">{row.email}</a>
      </TableCell>
      <TableCell className="align-top">{row.service || '—'}</TableCell>
      <TableCell className="align-top">{row.source}</TableCell>
      <TableCell className="align-top"><InquiryMessage message={row.message} /></TableCell>
      <TableCell className="align-top">
        <div className="flex flex-col items-start gap-2">
          <CopyEmailButton email={row.email} />
          <a href={attioSearchUrl(row.email)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
            Open in Attio
          </a>
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
          <TableHead>Source</TableHead>
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
