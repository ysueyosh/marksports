import React from 'react';
import styles from './OrderStatusChip.module.css';

interface OrderStatusChipProps {
  status: 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered';
}

const statusColors: Record<string, string> = {
  unpaid: '#ef4444',
  awaiting_shipment: '#f59e0b',
  in_transit: '#3b82f6',
  delivered: '#10b981',
};

const statusLabels: Record<string, string> = {
  unpaid: '未払い',
  awaiting_shipment: '配送待ち',
  in_transit: '配送中',
  delivered: '配送済',
};

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({ status }) => {
  return (
    <span
      className={styles.chip}
      style={{ backgroundColor: statusColors[status] }}
    >
      {statusLabels[status]}
    </span>
  );
};

export default OrderStatusChip;
