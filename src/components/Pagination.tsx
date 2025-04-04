"use client";

import {
  Pagination as PaginationUI,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  param?: string;
  totalPages: number;
}

const Pagination = ({ param = "page", totalPages }: PaginationProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(param, page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const currentPage = parseInt(searchParams.get(param) ?? "1");

  return (
    <PaginationUI>
      <PaginationContent className="m-6">
        {/* 1. Previous button if not on first page */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={createPageUrl(currentPage - 1)} />
          </PaginationItem>
        )}

        {/* 2. First page if not on first page */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink href={createPageUrl(1)}>1</PaginationLink>
          </PaginationItem>
        )}

        {/* 3. Ellipsis if gap between first page and previous page */}
        {currentPage - 1 > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* 4. Previous page number if not on first page */}
        {currentPage - 1 > 1 && (
          <PaginationItem>
            <PaginationLink href={createPageUrl(currentPage - 1)}>
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* 5. Current page (always shown) */}
        <PaginationItem>
          <PaginationLink isActive href={createPageUrl(currentPage)}>
            {currentPage}
          </PaginationLink>
        </PaginationItem>

        {/* 6. Next page number if not on last page */}
        {currentPage + 1 < totalPages && (
          <PaginationItem>
            <PaginationLink href={createPageUrl(currentPage + 1)}>
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* 7. Ellipsis if gap between next page and last page */}
        {currentPage + 1 < totalPages - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* 8. Last page if not on last page */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink href={createPageUrl(totalPages)}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* 9. Next button if not on last page */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={createPageUrl(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationUI>
  );
};

export default Pagination;
