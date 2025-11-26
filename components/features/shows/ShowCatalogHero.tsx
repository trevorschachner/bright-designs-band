'use client';

// View toggle controls have moved into the results table toolbar

interface ShowCatalogHeroProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalShows?: number;
}

export function ShowCatalogHero({ 
  viewMode: _viewMode, 
  onViewModeChange: _onViewModeChange,
  totalShows: _totalShows 
}: ShowCatalogHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-4">
            Show Catalog
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our collection of championship-caliber marching band shows designed for competitive success
          </p>


          {/* View toggle removed from hero; now rendered in table toolbar */}
        </div>
      </div>
    </section>
  );
}

