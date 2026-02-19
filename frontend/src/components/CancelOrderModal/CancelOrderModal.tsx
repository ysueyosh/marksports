'use client';

import React, { useState } from 'react';
import { cancelOrder } from '@/api/orders';
import { TextInput } from '@/components/Input/TextInput';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Alert,
  Link as MuiLink,
} from '@mui/material';

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

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>注文のキャンセル</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={2}
          mt={1}
          noValidate
        >
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
          <MuiLink href="/returns" target="_blank" rel="noopener noreferrer">
            キャンセルポリシーを確認
          </MuiLink>
          <FormControlLabel
            control={
              <Checkbox
                checked={policyAgreed}
                onChange={(e) => setPolicyAgreed(e.target.checked)}
                disabled={loading}
              />
            }
            label="キャンセルポリシーに同意します"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !reason.trim() || !policyAgreed}
        >
          {loading ? '処理中...' : 'キャンセルリクエスト'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
