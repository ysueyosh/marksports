import styles from './NotificationTag.module.css';

interface NotificationTagProps {
  tag?: 'important' | 'sale';
}

export default function NotificationTag({ tag }: NotificationTagProps) {
  if (!tag) return null;

  const tagLabel = tag === 'important' ? '重要' : 'セール';
  const tagClass = tag === 'important' ? styles.important : styles.sale;

  return <span className={`${styles.tag} ${tagClass}`}>{tagLabel}</span>;
}
