import React from 'react';
import { Badge } from './Badge';
import { ItemRequest } from '../../types';

interface PriorityBadgeProps {
  priority: ItemRequest['priority'];
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const getVariantByPriority = (): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (priority) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (): string => {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'critical':
        return 'Critical';
      default:
        return priority;
    }
  };

  return (
    <Badge variant={getVariantByPriority()} className={className}>
      {getPriorityLabel()}
    </Badge>
  );
};