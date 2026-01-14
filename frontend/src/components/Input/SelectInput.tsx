import React from 'react';
import styles from './SelectInput.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
    <div className={styles.container} style={containerStyle}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={className || styles.select}
        style={selectStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
