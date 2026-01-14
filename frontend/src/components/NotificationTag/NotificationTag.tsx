import styles from './NotificationTag.module.css';

interface NotificationTagProps {
  tag?: 'important';
}

export default function NotificationTag({ tag }: NotificationTagProps) {
  if (!tag) return null;

  const tagLabel = '重要';
  const tagClass = styles.important;

  return <span className={`${styles.tag} ${tagClass}`}>{tagLabel}</span>;
}
