import Link from 'next/link';
import { redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { getArrangementsPageForAdmin, type AdminArrangementRow } from '@/lib/services/admin';
import { PageLinks, parsePage } from '@/components/features/admin/PageLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const MAX_QUERY = 80;

/**
 * Every arrangement (show part), searchable by title with `?q=`. Parts are
 * edited inside their show's editor, so each row links there; a part no show
 * uses has no editor and is listed without a link.
 */
export default async function AdminArrangementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) redirect('/admin');

  const params = await searchParams;
  const page = parsePage(params.page);
  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = rawQ?.trim().slice(0, MAX_QUERY) || undefined;

  let result: { data: AdminArrangementRow[]; total: number } | null = null;
  try {
    result = await getArrangementsPageForAdmin({ q, page, limit: PAGE_SIZE });
  } catch (error) {
    console.error('Error fetching arrangements:', error);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin">Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Arrangements</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-4xl font-bold mb-2">Arrangements</h1>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Every show part. Open a part&apos;s show to edit it, its files and its pieces.
      </p>
      <form role="search" action="/admin/arrangements" className="mb-4 flex max-w-md gap-2">
        <Input type="search" name="q" defaultValue={q ?? ''} placeholder="Search by title" aria-label="Search arrangements" maxLength={MAX_QUERY} />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {result === null ? (
        <p className="text-destructive">Could not load the arrangements. Reload to try again.</p>
      ) : result.data.length === 0 ? (
        <p>No arrangements found.</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Composer</TableHead>
                <TableHead>Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.showTitle ? <Link href={row.href} className="hover:underline">{row.title}</Link> : row.title}
                  </TableCell>
                  <TableCell>{row.composer ?? '—'}</TableCell>
                  <TableCell>{row.showTitle ?? <span className="text-muted-foreground">Not in a show</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PageLinks
            basePath="/admin/arrangements"
            page={page}
            totalPages={Math.ceil(result.total / PAGE_SIZE)}
            total={result.total}
            extra={{ q }}
          />
        </div>
      )}
    </div>
  );
}
