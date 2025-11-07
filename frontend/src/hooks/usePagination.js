import { useState, useEffect } from 'react';

/**
 * Custom hook for pagination
 */
export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPageState);

  // Calculate current items
  const indexOfLastItem = currentPage * itemsPerPageState;
  const indexOfFirstItem = indexOfLastItem - itemsPerPageState;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Go to specific page
  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Go to first page
  const firstPage = () => {
    setCurrentPage(1);
  };

  // Go to last page
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  // Change items per page
  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPageState(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    itemsPerPage: itemsPerPageState,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeItemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
