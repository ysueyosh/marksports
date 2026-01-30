import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  FormHelperText,
  Box,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface TextInputProps {
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  placeholder?: string;
  label?: string;
  inputType?:
    | 'number'
    | 'text'
    | 'alpha'
    | 'alphanumeric'
    | 'password'
    | 'textarea';
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  autoComplete?: string;
  error?: string;
  rows?: number;
}

/**
 * 共通テキストインプットコンポーネント
 * @param inputType
 *   - 'number': 数値のみ（0-9）
 *   - 'text': 文字のみ（ひらがな、漢字など）
 *   - 'alpha': 英文字のみ（a-zA-Z）
 *   - 'alphanumeric': 英数字（a-zA-Z0-9）
 *   - 'password': パスワード（表示/非表示切り替え機能付き）
 */
export const TextInput: React.FC<TextInputProps> = ({
  name,
  value,
  onChange,
  placeholder,
  label,
  inputType = 'text',
  maxLength,
  disabled = false,
  required = false,
  className,
  containerStyle,
  inputStyle,
  autoComplete,
  error,
  rows = 4,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputType === 'password';
  const isTextarea = inputType === 'textarea';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const inputValue = e.target.value;
    let filteredValue = inputValue;

    // 入力タイプに基づいてフィルタリング（パスワードはフィルタリングしない）
    if (inputType !== 'password') {
      switch (inputType) {
        case 'number':
          filteredValue = inputValue.replace(/\D/g, '');
          break;
        case 'alpha':
          filteredValue = inputValue.replace(/[^a-zA-Z]/g, '');
          break;
        case 'alphanumeric':
          filteredValue = inputValue.replace(/[^a-zA-Z0-9]/g, '');
          break;
        case 'text':
          // 危険な記号のみ除外
          filteredValue = inputValue.replace(/[<>\"'`]/g, '');
          break;
        default:
          filteredValue = inputValue;
      }
    } else {
      filteredValue = inputValue;
    }

    // maxLengthの処理
    if (maxLength && filteredValue.length > maxLength) {
      filteredValue = filteredValue.slice(0, maxLength);
    }

    // イベントオブジェクトを修正してonChangeを呼び出す
    e.target.value = filteredValue;
    onChange(e);
  };

  return (
    <Box sx={containerStyle}>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
          {required && (
            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Box>
          )}
        </Typography>
      )}
      <TextField
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
        disabled={disabled}
        required={required}
        fullWidth
        size="small"
        multiline={isTextarea}
        rows={isTextarea ? rows : undefined}
        inputProps={{ maxLength }}
        autoComplete={autoComplete}
        error={Boolean(error)}
        sx={inputStyle}
        InputProps={
          isPassword
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={disabled}
                      edge="end"
                      aria-label={
                        showPassword ? 'パスワードを非表示' : 'パスワードを表示'
                      }
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            : undefined
        }
      />
      {error && (
        <FormHelperText error sx={{ mt: 0.5 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
};

export default TextInput;
