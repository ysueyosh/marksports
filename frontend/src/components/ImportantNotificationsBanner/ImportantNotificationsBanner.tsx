'use client';

import Link from 'next/link';
import { Alert, Box } from '@mui/material';
import { useNotificationContext } from '@/context/NotificationContext';

export default function ImportantNotificationsBanner() {
  const { importantNotifications } = useNotificationContext();

  if (importantNotifications.length === 0) return null;

  return (
    <Alert severity="warning" icon={false}>
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Box component="span">⚠️</Box>
        {importantNotifications.map((notification, index) => (
          <Box component="span" key={notification.id}>
            {index > 0 && <Box component="span">・</Box>}
            <Box
              component={Link}
              href={`/notifications/detail?id=${notification.id}`}
              sx={{ color: 'inherit', fontWeight: 600 }}
            >
              {notification.title}
            </Box>
          </Box>
        ))}
      </Box>
    </Alert>
  );
}
