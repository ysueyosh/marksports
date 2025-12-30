export default function LoadingSpinner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '30px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto 15px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          読み込み中...
        </p>
      </div>
    </div>
  );
}
