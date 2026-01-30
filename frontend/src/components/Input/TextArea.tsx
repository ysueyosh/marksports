import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

interface TextAreaProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
  containerStyle?: React.CSSProperties;
  textareaStyle?: React.CSSProperties;
  error?: string;
}

/**
 * 共通テキストエリアコンポーネント
 */
export const TextArea: React.FC<TextAreaProps> = ({
  name,
  value,
  onChange,
  placeholder,
  label,
  maxLength,
  disabled = false,
  required = false,
  rows = 4,
  containerStyle,
  error,
}) => {
  const characterCount = value.length;
  const hasMaxLength = maxLength !== undefined;

  return (
    <Box sx={containerStyle}>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
          {required && (
            <Typography component="span" color="error.main" ml={0.5}>
              *
            </Typography>
          )}
        </Typography>
      )}
      <TextField
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        multiline
        fullWidth
        error={Boolean(error)}
        inputProps={{ maxLength }}
      />
      <Box display="flex" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="error.main">
          {error || ''}
        </Typography>
        {hasMaxLength && (
          <Typography variant="caption" color="text.secondary">
            {characterCount}/{maxLength}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TextArea;
