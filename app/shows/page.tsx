'use client';

import { useState, useEffect } from "react";
import ResourcePage from "@/components/features/resources/ResourcePage";
import { ShowCard } from "@/components/features/shows/ShowCard";
import { ShowListView } from "@/components/features/shows/ShowListView";
import { ShowCatalogHero } from "@/components/features/shows/ShowCatalogHero";
import { SHOWS_FILTER_FIELDS } from "@/lib/filters/schema-analyzer";
import { SHOWS_PRESETS } from "@/lib/filters/presets";
import { Show } from "@/lib/types/shows";

export default function ShowsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalShows, setTotalShows] = useState<number | undefined>(undefined);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('showsViewMode') as 'grid' | 'list' | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('showsViewMode', mode);
  };

  return (
    <div>
      {/* Hero Section */}
      <ShowCatalogHero 
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        totalShows={totalShows}
      />

      {/* Main Content with Sidebar Layout */}
      <ResourcePage<Show>
        resourceName="shows"
        apiEndpoint="/api/shows"
        filterFields={SHOWS_FILTER_FIELDS}
        filterPresets={SHOWS_PRESETS}
        CardComponent={ShowCard}
        ListComponent={ShowListView}
        viewMode={viewMode}
        useSidebar={true}
      />
    </div>
  );
}
