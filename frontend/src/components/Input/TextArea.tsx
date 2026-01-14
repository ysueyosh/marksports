import React from 'react';
import styles from './TextArea.module.css';

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
  className,
  containerStyle,
  textareaStyle,
  error,
}) => {
  const characterCount = value.length;
  const hasMaxLength = maxLength !== undefined;

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={containerStyle}
    >
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.textareaWrapper}>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          className={`${styles.textarea} ${error ? styles.error : ''} ${
            disabled ? styles.disabled : ''
          }`}
          style={textareaStyle}
        />
      </div>
      <div className={styles.footer}>
        {error && <span className={styles.errorText}>{error}</span>}
        {hasMaxLength && (
          <span className={styles.characterCount}>
            {characterCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
