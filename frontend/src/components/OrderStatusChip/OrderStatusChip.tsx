import React from 'react';
import { Chip } from '@mui/material';

interface OrderStatusChipProps {
  status:
    | 'unpaid'
    | 'awaiting_shipment'
    | 'in_transit'
    | 'delivered'
    | 'cancelled_customer'
    | 'cancelled_internal';
}

const statusColors: Record<string, string> = {
  unpaid: '#ef4444',
  awaiting_shipment: '#f59e0b',
  in_transit: '#3b82f6',
  delivered: '#10b981',
  cancelled_customer: '#8b5cf6',
  cancelled_internal: '#6366f1',
};

const statusLabels: Record<string, string> = {
  unpaid: '未払い',
  awaiting_shipment: '配送待ち',
  in_transit: '配送中',
  delivered: '配送済',
  cancelled_customer: 'キャンセル(顧客都合)',
  cancelled_internal: 'キャンセル(社内都合)',
};

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({ status }) => {
  return (
    <Chip
      label={statusLabels[status]}
      sx={{
        bgcolor: statusColors[status],
        color: '#fff',
        fontWeight: 700,
      }}
      size="small"
    />
  );
};

export default OrderStatusChip;
