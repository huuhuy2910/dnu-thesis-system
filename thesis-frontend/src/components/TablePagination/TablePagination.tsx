import React from "react";
import "./TablePagination.css";

type TablePaginationProps = {
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  isLoading?: boolean;
  pageSizeOptions?: number[];
  totalLabel?: string;
  pageSizeLabel?: string;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
};

const defaultPageSizeOptions = [10, 20, 50, 100];

const TablePagination: React.FC<TablePaginationProps> = ({
  totalCount,
  page,
  pageCount,
  pageSize,
  isLoading = false,
  pageSizeOptions = defaultPageSizeOptions,
  totalLabel = "Tổng bản ghi:",
  pageSizeLabel = "Page size",
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <div className="table-pagination">
      <div>
        {totalLabel} <strong>{totalCount}</strong>
      </div>

      <div className="table-pagination-controls">
        <label>
          {pageSizeLabel}
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Trước
        </button>
        <span>
          Trang {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount || isLoading}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
