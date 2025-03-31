import React from 'react';

export function LastUpdated({ timestamp }) {
  if (!timestamp) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="text-sm text-gray-500 mt-2 text-center">
      Last updated: {formatDate(timestamp)}
    </div>
  );
} 