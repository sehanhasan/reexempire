import { useState, useEffect } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationControls {
  goToPage: (page: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  setPageSize: (size: number) => void;
}

export interface UsePaginationReturn {
  pagination: PaginationState;
  controls: PaginationControls;
  paginatedData: <T>(data: T[]) => T[];
  getOffset: () => number;
}

export function usePagination(
  totalItems: number = 0,
  initialPageSize: number = 25
): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to page 1 when total items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSetPageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const paginatedData = <T,>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const getOffset = () => (currentPage - 1) * pageSize;

  return {
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
    },
    controls: {
      goToPage,
      goToNext,
      goToPrevious,
      setPageSize: handleSetPageSize,
    },
    paginatedData,
    getOffset,
  };
}