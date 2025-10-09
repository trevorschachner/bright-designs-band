'use client';

import { Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShowCatalogHeroProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalShows?: number;
}

export function ShowCatalogHero({ 
  viewMode, 
  onViewModeChange,
  totalShows 
}: ShowCatalogHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 font-primary">
            Show Catalog
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our collection of championship-caliber marching band shows designed for competitive success
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {totalShows ? `${totalShows}+` : '50+'} Championship Shows
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Multiple Difficulty Levels
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Award-Winning Designs
            </Badge>
          </div>

          {/* View Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="w-4 h-4" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              List View
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

