import { redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { getInquiriesPage, type InquiryRow } from '@/lib/services/admin';
import { PageLinks, parsePage } from '@/components/features/admin/PageLinks';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { InquiriesTable } from './InquiriesTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

/**
 * Contact-form submissions, newest first. Read-only: client records live in
 * Attio, so there is no status or notes editing here. The layout requires
 * admin access; the explicit guard keeps this page safe if it ever moves.
 * School/organisation is not stored by /api/contact (it goes in the email
 * only), so there is no column for it.
 */
export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const gate = await guard('canAccessAdmin');
  if (gate.denied) redirect('/');

  const page = parsePage((await searchParams).page);
  let result: { data: InquiryRow[]; total: number } | null = null;
  try {
    result = await getInquiriesPage({ page, limit: PAGE_SIZE });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
  }
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Inquiries</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-4xl font-bold mb-2">Inquiries</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Every contact-form submission, newest first. Follow up in Attio; nothing here can be edited.
      </p>
      {result === null ? (
        <p className="text-destructive">Could not load the inquiries. Reload to try again.</p>
      ) : result.data.length === 0 ? (
        <p>No inquiries {page > 1 ? 'on this page' : 'yet'}.</p>
      ) : (
        <div className="border rounded-md">
          <InquiriesTable rows={result.data} />
          <PageLinks basePath="/admin/inquiries" page={page} totalPages={totalPages} total={result.total} />
        </div>
      )}
    </div>
  );
}
