import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    // Always include first page
    pageNumbers.push(1);

    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }

    // Always include last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    // Add ellipses where needed
    const result = [];
    let lastPage = 0;

    for (const page of pageNumbers) {
      if (lastPage + 1 < page) {
        result.push(-lastPage); // Negative value to indicate ellipsis
      }
      result.push(page);
      lastPage = page;
    }

    return result;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {pages.map((page, i) => {
        if (page < 0) {
          // Ellipsis
          return (
            <Button
              key={`ellipsis-${i}`}
              variant="ghost"
              size="icon"
              disabled
              className="cursor-default"
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className="hidden sm:inline-flex"
          >
            {page}
          </Button>
        );
      })}

      <span className="sm:hidden text-sm">{`Page ${currentPage} of ${totalPages}`}</span>

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}