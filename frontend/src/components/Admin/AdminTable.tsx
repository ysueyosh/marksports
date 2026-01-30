import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';

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
  const cellSx = (col?: TableColumn) => ({
    width: col?.width,
    textAlign: col?.align,
    display: {
      xs: col?.hide?.mobile ? 'none' : 'table-cell',
      sm: col?.hide?.tablet ? 'none' : 'table-cell',
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table size="small" className={className}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={cellSx(col)}>
                  {col.label}
                </TableCell>
              ))}
              {actions && <TableCell>操作</TableCell>}
            </TableRow>
          </TableHead>
        </Table>
        <Typography color="text.secondary" align="center" py={4}>
          {emptyMessage}
        </Typography>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small" className={className}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={cellSx(col)}>
                {col.label}
              </TableCell>
            ))}
            {actions && <TableCell>操作</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row[rowKey]}
              hover={Boolean(onRowClick)}
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <TableCell key={`${row[rowKey]}-${col.key}`} sx={cellSx(col)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </TableCell>
              ))}
              {actions && (
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="small"
                        variant={
                          action.variant === 'primary'
                            ? 'contained'
                            : action.variant === 'danger'
                              ? 'outlined'
                              : 'text'
                        }
                        color={
                          action.variant === 'danger' ? 'error' : 'primary'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminTable;
