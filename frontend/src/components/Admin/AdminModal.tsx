import { ReactNode, useRef, useEffect } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  buttons: ReactNode;
  shouldScrollToTop?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  buttons,
  shouldScrollToTop = false,
}: AdminModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollToTop && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [shouldScrollToTop]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={contentRef}
          style={{
            padding: '30px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '20px',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
          {children}
        </div>
        <div
          style={{
            padding: '12px 30px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
        >
          {buttons}
        </div>
      </div>
    </div>
  );
}
