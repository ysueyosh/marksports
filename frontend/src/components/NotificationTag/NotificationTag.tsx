import { Chip } from '@mui/material';

interface NotificationTagProps {
  tag?: 'important';
}

export default function NotificationTag({ tag }: NotificationTagProps) {
  if (!tag) return null;

  const tagLabel = '重要';
  return <Chip label={tagLabel} color="error" size="small" />;
}
