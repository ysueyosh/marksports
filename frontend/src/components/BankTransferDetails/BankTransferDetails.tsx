import React from 'react';

const BankTransferDetails: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
        marginTop: '10px',
      }}
    >
      <h4 style={{ marginBottom: '10px' }}>口座振込情報</h4>
      <p style={{ marginBottom: '8px', fontSize: '14px' }}>
        <strong>銀行:</strong> 〇〇銀行
      </p>
      <p style={{ marginBottom: '8px', fontSize: '14px' }}>
        <strong>支店:</strong> 〇〇支店
      </p>
      <p style={{ marginBottom: '8px', fontSize: '14px' }}>
        <strong>口座種別:</strong> 普通
      </p>
      <p style={{ marginBottom: '8px', fontSize: '14px' }}>
        <strong>口座番号:</strong> 1234567
      </p>
      <p style={{ marginBottom: '8px', fontSize: '14px' }}>
        <strong>名義人:</strong> マークスポーツ
      </p>
    </div>
  );
};

export default BankTransferDetails;
