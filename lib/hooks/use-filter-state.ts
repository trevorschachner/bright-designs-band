'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterState } from '@/lib/filters/types';
import { FilterUrlManager } from '@/lib/filters/query-builder';

interface UseFilterStateOptions {
  defaultState?: Partial<FilterState>;
  syncWithUrl?: boolean;
  baseUrl?: string;
}

interface UseFilterStateReturn {
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  updateFilterState: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  isLoading: boolean;
}

/**
 * Custom hook for managing filter state with optional URL synchronization
 */
export function useFilterState({
  defaultState = {},
  syncWithUrl = true,
  baseUrl
}: UseFilterStateOptions = {}): UseFilterStateReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize filter state
  const [filterState, setInternalFilterState] = useState<FilterState>(() => {
    const initialState: FilterState = {
      search: undefined,
      conditions: [],
      sort: [],
      page: 1,
      limit: 20,
      ...defaultState
    };

    // If syncing with URL, parse from search params
    if (syncWithUrl && searchParams) {
      try {
        const urlState = FilterUrlManager.fromUrlParams(searchParams);
        return { ...initialState, ...urlState };
      } catch (error) {
        console.warn('Failed to parse filter state from URL:', error);
      }
    }

    return initialState;
  });

  // Update URL when filter state changes
  useEffect(() => {
    if (!syncWithUrl) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(#59-followup): debounced URL push flags loading on every state change, including URL-originated ones
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        const currentUrl = window.location.pathname;
        const targetUrl = baseUrl || currentUrl;
        const newUrl = FilterUrlManager.getUrl(targetUrl, filterState);
        
        // Only update if URL actually changed
        if (newUrl !== window.location.href) {
          router.push(newUrl, { scroll: false });
        }
      } catch (error) {
        console.warn('Failed to update URL with filter state:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce URL updates

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [filterState, syncWithUrl, baseUrl, router]);

  // Merge URL params into the state when they change (e.g. browser
  // back/forward), adjusting state during render rather than in an effect.
  const [syncedParams, setSyncedParams] = useState(searchParams);
  if (syncWithUrl && searchParams && searchParams !== syncedParams) {
    setSyncedParams(searchParams);
    try {
      const urlState = FilterUrlManager.fromUrlParams(searchParams);
      setInternalFilterState(currentState => {
        const newState = { ...currentState, ...urlState };
        return JSON.stringify(newState) !== JSON.stringify(currentState) ? newState : currentState;
      });
    } catch (error) {
      console.warn('Failed to parse filter state from URL params:', error);
    }
  }

  const setFilterState = useCallback((newState: FilterState) => {
    setInternalFilterState(newState);
  }, []);

  const updateFilterState = useCallback((updates: Partial<FilterState>) => {
    setInternalFilterState(current => ({ ...current, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    const resetState: FilterState = {
      search: undefined,
      conditions: [],
      sort: [],
      page: 1,
      limit: filterState.limit, // Preserve limit
      ...defaultState
    };
    setInternalFilterState(resetState);
  }, [defaultState, filterState.limit]);

  return {
    filterState,
    setFilterState,
    updateFilterState,
    resetFilters,
    isLoading
  };
}

/**
 * Hook for debounced filter updates (useful for search inputs)
 */
export function useDebouncedFilterState(
  filterState: FilterState,
  setFilterState: (state: FilterState) => void,
  delay: number = 300
) {
  const [debouncedState, setDebouncedState] = useState(filterState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(filterState);
    }, delay);

    return () => clearTimeout(timer);
  }, [filterState, delay]);

  useEffect(() => {
    if (JSON.stringify(debouncedState) !== JSON.stringify(filterState)) {
      setFilterState(debouncedState);
    }
  }, [debouncedState, filterState, setFilterState]);

  return {
    debouncedState,
    setDebouncedState
  };
}