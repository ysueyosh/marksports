'use client';

import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  getItemNoteError,
  getItemNoteLabel,
  getItemNoteMaxLength,
  isItemNoteEnabled,
} from '@/utils/item-note';

interface Props {
  itemNote?: string;
  itemNoteSetting?: string | null;
  itemNoteLabel?: string | null;
  itemNoteMaxLength?: number | null;
  /** 保存処理。成功したら true を返す */
  onSave: (itemNote: string) => Promise<boolean>;
}

/**
 * カート内で商品備考を表示・編集する
 */
export default function CartItemNoteEditor({
  itemNote = '',
  itemNoteSetting,
  itemNoteLabel,
  itemNoteMaxLength,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(itemNote);
  const [isSaving, setIsSaving] = useState(false);

  if (!isItemNoteEnabled(itemNoteSetting)) return null;

  const label = getItemNoteLabel(itemNoteLabel);
  const maxLength = getItemNoteMaxLength(itemNoteMaxLength);
  const isRequired = itemNoteSetting === 'required';
  const error = getItemNoteError(
    draft,
    itemNoteSetting,
    itemNoteLabel,
    itemNoteMaxLength,
  );

  const startEditing = () => {
    setDraft(itemNote);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (error) return;
    const next = draft.trim();
    if (next === itemNote) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const ok = await onSave(next);
    setIsSaving(false);
    if (ok) setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" fontWeight={700} display="block">
          {label}
          {isRequired && (
            <Typography component="span" variant="caption" color="error">
              {' '}
              *必須
            </Typography>
          )}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          error={Boolean(error)}
          helperText={error ?? `${draft.length}/${maxLength}文字`}
          inputProps={{ maxLength, 'aria-label': label }}
          disabled={isSaving}
          sx={{ mt: 0.5 }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || Boolean(error)}
          >
            保存
          </Button>
          <Button
            size="small"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            キャンセル
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: isRequired && !itemNote ? 'error.main' : 'grey.200',
        borderRadius: 1,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <Typography variant="caption" fontWeight={700}>
          {label}
        </Typography>
        <Button
          size="small"
          startIcon={<EditOutlinedIcon fontSize="small" />}
          onClick={startEditing}
          sx={{ minWidth: 0, py: 0 }}
        >
          {itemNote ? '編集' : '入力'}
        </Button>
      </Stack>
      {itemNote ? (
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {itemNote}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          color={isRequired ? 'error' : 'text.secondary'}
        >
          {isRequired ? `${label}を入力してください` : '未入力'}
        </Typography>
      )}
    </Box>
  );
}
