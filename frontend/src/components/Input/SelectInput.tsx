import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  value: string;
  onChange: (e: any) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerStyle?: React.CSSProperties;
  selectStyle?: React.CSSProperties;
}

/**
 * 共通セレクト（ドロップダウン）コンポーネント
 */
export const SelectInput: React.FC<SelectInputProps> = ({
  name,
  value,
  onChange,
  options,
  placeholder = '選択してください',
  label,
  disabled = false,
  required = false,
  className,
  containerStyle,
  selectStyle,
}) => {
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
      <FormControl
        fullWidth
        size="small"
        disabled={disabled}
        required={required}
      >
        <InputLabel id={`${name}-label`}>{placeholder}</InputLabel>
        <Select
          labelId={`${name}-label`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          label={placeholder}
          sx={selectStyle}
        >
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SelectInput;
