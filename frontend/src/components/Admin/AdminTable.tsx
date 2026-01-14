import React from 'react';
import styles from './AdminTable.module.css';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  hide?: {
    mobile?: boolean;
    tablet?: boolean;
  };
}

export interface TableRowAction {
  label: string;
  onClick: (row: any) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface AdminTableProps {
  columns: TableColumn[];
  data: any[];
  rowKey: string;
  actions?: TableRowAction[];
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (row: any) => string;
  isLoading?: boolean;
}

const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  data,
  rowKey,
  actions,
  onRowClick,
  emptyMessage = 'データが見つかりません',
  className,
  rowClassName,
  isLoading = false,
}) => {
  if (isLoading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  if (data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <table className={`${styles.table} ${className || ''}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.hide?.mobile ? styles.hideMobile : ''}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th>操作</th>}
            </tr>
          </thead>
        </table>
        <div className={styles.empty}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={`${styles.table} ${className || ''}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`${col.hide?.mobile ? styles.hideMobile : ''} ${
                  col.hide?.tablet ? styles.hideTablet : ''
                }`}
              >
                {col.label}
              </th>
            ))}
            {actions && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className={rowClassName ? rowClassName(row) : ''}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td
                  key={`${row[rowKey]}-${col.key}`}
                  style={{
                    width: col.width,
                    textAlign: col.align,
                  }}
                  className={`${col.hide?.mobile ? styles.hideMobile : ''} ${
                    col.hide?.tablet ? styles.hideTablet : ''
                  }`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className={styles.actionCell}>
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row);
                      }}
                      className={`${styles.button} ${
                        styles[action.variant || 'secondary']
                      } ${action.className || ''}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
