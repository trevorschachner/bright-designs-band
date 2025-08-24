'use client';

import ResourcePage from "@/components/features/resources/ResourcePage";
import { ShowCard } from "@/components/features/shows/ShowCard";
import { SHOWS_FILTER_FIELDS } from "@/lib/filters/schema-analyzer";
import { SHOWS_PRESETS } from "@/lib/filters/presets";
import { Show } from "@/lib/types/shows";

export default function ShowsPage() {
  return (
    <div className="container mx-auto py-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-8">Show Catalog</h1>
      </div>
      <ResourcePage<Show>
        resourceName="shows"
        apiEndpoint="/api/shows"
        filterFields={SHOWS_FILTER_FIELDS}
        filterPresets={SHOWS_PRESETS}
        CardComponent={ShowCard}
      />
    </div>
  );
}
