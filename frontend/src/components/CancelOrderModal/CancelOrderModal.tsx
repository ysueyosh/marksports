'use client';

import React, { useState } from 'react';
import { cancelOrder } from '@/api/orders';
import { TextInput } from '@/components/Input/TextInput';
import { useSnackbar } from '@/context/SnackbarContext';
import styles from './CancelOrderModal.module.css';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: (response: {
    orderId: string;
    status: string;
    cancelRequestSent: boolean;
  }) => void;
}

export default function CancelOrderModal({
  isOpen,
  orderId,
  onClose,
  onSuccess,
}: CancelOrderModalProps) {
  const { show: showSnackbar } = useSnackbar();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('取消理由を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await cancelOrder(orderId, reason);

      if (response.success && response.data) {
        const data = response.data;
        setReason('');
        showSnackbar('キャンセルリクエストが送信されました', 'success', 3000);
        onSuccess({
          orderId: data.orderId || '',
          status: data.status || '',
          cancelRequestSent: data.cancelRequestSent || false,
        });
        onClose();
      } else {
        setError(response.message || 'キャンセルに失敗しました');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>注文のキャンセル</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <TextInput
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="注文をキャンセルする理由をお聞かせください..."
              disabled={loading}
              inputType="textarea"
              rows={5}
              label="取消理由"
            />
            <a
              href="/returns"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.policyLink}
            >
              キャンセルポリシーを確認
            </a>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="policyAgree"
              checked={policyAgreed}
              onChange={(e) => setPolicyAgreed(e.target.checked)}
              disabled={loading}
              className={styles.checkbox}
            />
            <label htmlFor="policyAgree" className={styles.checkboxLabel}>
              キャンセルポリシーに同意します
            </label>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim() || !policyAgreed}
              className={styles.submitButton}
            >
              {loading ? '処理中...' : 'キャンセルリクエスト'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
