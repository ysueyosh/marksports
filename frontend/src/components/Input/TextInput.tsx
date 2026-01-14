import React, { useState } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    <div className={styles.container} style={containerStyle}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={isPassword ? styles.passwordContainer : undefined}>
        {isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            required={required}
            rows={rows}
            className={className || styles.input}
            style={{
              ...inputStyle,
              borderColor: error ? '#e74c3c' : undefined,
              resize: 'vertical',
            }}
          />
        ) : (
          <>
            <input
              id={name}
              type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              className={className || styles.input}
              style={{
                ...inputStyle,
                borderColor: error ? '#e74c3c' : undefined,
              }}
              autoComplete={autoComplete}
            />
            {isPassword && (
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
                title={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
              >
                {showPassword ? (
                  // VisibilityOff icon (非表示にするボタン)
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  // Visibility icon (表示するボタン)
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            )}
          </>
        )}
      </div>
      {error && (
        <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default TextInput;
