import React from 'react';
import { Badge } from './Badge';
import { ItemRequest } from '../../types';

interface StatusBadgeProps {
  status: ItemRequest['status'];
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getVariantByStatus = (): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'fulfilled':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'fulfilled':
        return 'Fulfilled';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariantByStatus()} className={className}>
      {getStatusLabel()}
    </Badge>
  );
};