import { ShowEditor } from '@/components/features/admin/show-editor/ShowEditor';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { getTagsForAdmin } from '@/lib/services/tags';

export const dynamic = 'force-dynamic';

/**
 * New show: the editor's form in create mode. `createShow`, then the picked
 * thumbnail is uploaded to the new show's id, then the full editor opens.
 */
export default async function NewShowPage() {
  const allTags = await getTagsForAdmin();
  return (
    <div className="container mx-auto py-20 space-y-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/shows">Shows</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add New Show</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-4xl font-bold text-center">Add New Show</h1>

      <ShowEditor mode="create" allTags={allTags} />
    </div>
  );
}
