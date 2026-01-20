'use client';

import MainLayout from '@/components/Layout/MainLayout';
import styles from './register.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register as apiRegister } from '@/api/register';
import { useLoading } from '@/context/LoadingContext';
import { TextInput } from '@/components/Input/TextInput';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import { searchAddressByPostalCode } from '@/api/address';

interface AddressFormData {
  name: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
  sex: string;
  registerAddress: boolean; // チェックボックス
  postalCode: string;
  prefecture: string;
  address: string;
  option: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    sex: '',
    registerAddress: false,
    postalCode: '',
    prefecture: '',
    address: '',
    option: '',
  });
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isPrefectureDropdownOpen, setIsPrefectureDropdownOpen] =
    useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(
    null
  );
  const router = useRouter();
  const { setIsLoading } = useLoading();

  // 日本語都道府県名から英語キーへのマッピング
  const prefectureMap: { [key: string]: string } = {
    北海道: 'hokkaido',
    青森県: 'aomori',
    岩手県: 'iwate',
    宮城県: 'miyagi',
    秋田県: 'akita',
    山形県: 'yamagata',
    福島県: 'fukushima',
    茨城県: 'ibaraki',
    栃木県: 'tochigi',
    群馬県: 'gunma',
    埼玉県: 'saitama',
    千葉県: 'chiba',
    東京都: 'tokyo',
    神奈川県: 'kanagawa',
    新潟県: 'niigata',
    富山県: 'toyama',
    石川県: 'ishikawa',
    福井県: 'fukui',
    山梨県: 'yamanashi',
    長野県: 'nagano',
    岐阜県: 'gifu',
    静岡県: 'shizuoka',
    愛知県: 'aichi',
    三重県: 'mie',
    滋賀県: 'shiga',
    京都府: 'kyoto',
    大阪府: 'osaka',
    兵庫県: 'hyogo',
    奈良県: 'nara',
    和歌山県: 'wakayama',
    鳥取県: 'tottori',
    島根県: 'shimane',
    岡山県: 'okayama',
    広島県: 'hiroshima',
    山口県: 'yamaguchi',
    徳島県: 'tokushima',
    香川県: 'kagawa',
    愛媛県: 'ehime',
    高知県: 'kochi',
    福岡県: 'fukuoka',
    佐賀県: 'saga',
    長崎県: 'nagasaki',
    熊本県: 'kumamoto',
    大分県: 'oita',
    宮崎県: 'miyazaki',
    鹿児島県: 'kagoshima',
    沖縄県: 'okinawa',
  };

  // 都道府県セレクトオプション
  const prefectureOptions = [
    { id: 'hokkaido', label: '北海道' },
    { id: 'aomori', label: '青森県' },
    { id: 'iwate', label: '岩手県' },
    { id: 'miyagi', label: '宮城県' },
    { id: 'akita', label: '秋田県' },
    { id: 'yamagata', label: '山形県' },
    { id: 'fukushima', label: '福島県' },
    { id: 'ibaraki', label: '茨城県' },
    { id: 'tochigi', label: '栃木県' },
    { id: 'gunma', label: '群馬県' },
    { id: 'saitama', label: '埼玉県' },
    { id: 'chiba', label: '千葉県' },
    { id: 'tokyo', label: '東京都' },
    { id: 'kanagawa', label: '神奈川県' },
    { id: 'niigata', label: '新潟県' },
    { id: 'toyama', label: '富山県' },
    { id: 'ishikawa', label: '石川県' },
    { id: 'fukui', label: '福井県' },
    { id: 'yamanashi', label: '山梨県' },
    { id: 'nagano', label: '長野県' },
    { id: 'gifu', label: '岐阜県' },
    { id: 'shizuoka', label: '静岡県' },
    { id: 'aichi', label: '愛知県' },
    { id: 'mie', label: '三重県' },
    { id: 'shiga', label: '滋賀県' },
    { id: 'kyoto', label: '京都府' },
    { id: 'osaka', label: '大阪府' },
    { id: 'hyogo', label: '兵庫県' },
    { id: 'nara', label: '奈良県' },
    { id: 'wakayama', label: '和歌山県' },
    { id: 'tottori', label: '鳥取県' },
    { id: 'shimane', label: '島根県' },
    { id: 'okayama', label: '岡山県' },
    { id: 'hiroshima', label: '広島県' },
    { id: 'yamaguchi', label: '山口県' },
    { id: 'tokushima', label: '徳島県' },
    { id: 'kagawa', label: '香川県' },
    { id: 'ehime', label: '愛媛県' },
    { id: 'kochi', label: '高知県' },
    { id: 'fukuoka', label: '福岡県' },
    { id: 'saga', label: '佐賀県' },
    { id: 'nagasaki', label: '長崎県' },
    { id: 'kumamoto', label: '熊本県' },
    { id: 'oita', label: '大分県' },
    { id: 'miyazaki', label: '宮崎県' },
    { id: 'kagoshima', label: '鹿児島県' },
    { id: 'okinawa', label: '沖縄県' },
  ];

  const genderOptions = [
    { id: 'male', label: '男性' },
    { id: 'female', label: '女性' },
    { id: 'other', label: 'その他' },
  ];

  const handleSearchAddress = async () => {
    const postalCode = formData.postalCode.trim();

    if (!postalCode) {
      setAddressSearchError('郵便番号を入力してください');
      return;
    }

    if (!/^\d{7}$/.test(postalCode)) {
      setAddressSearchError('郵便番号は7桁の数字で入力してください');
      return;
    }

    setIsSearchingAddress(true);
    setIsLoading(true);
    setAddressSearchError(null);

    try {
      const response = await searchAddressByPostalCode(postalCode);

      if (response.success && response.data) {
        const prefectureValue =
          prefectureMap[response.data.prefecture] || response.data.prefecture;

        setFormData((prev) => ({
          ...prev,
          prefecture: prefectureValue,
          address: response.data!.address,
        }));
      } else {
        setAddressSearchError(response.message || '住所を検索できませんでした');
      }
    } catch (error) {
      console.error('Failed to search address:', error);
      setAddressSearchError('住所の検索に失敗しました');
    } finally {
      setIsSearchingAddress(false);
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;

    if (name === 'postalCode') {
      const digitsOnly = value.replace(/\D/g, '');
      const truncated = digitsOnly.slice(0, 7);
      setFormData((prev) => ({
        ...prev,
        [name]: truncated,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name) errors.name = 'お名前を入力してください';
    if (!formData.email) errors.email = 'メールアドレスを入力してください';
    if (!formData.password) errors.password = 'パスワードを入力してください';
    if (!formData.confirm)
      errors.confirm = 'パスワード（確認）を入力してください';

    // Validate address fields only if address registration is checked
    if (formData.registerAddress) {
      if (!formData.postalCode)
        errors.postalCode = '郵便番号を入力してください';
      if (!formData.prefecture)
        errors.prefecture = '都道府県を選択してください';
      if (!formData.address) errors.address = '住所を入力してください';
    }

    if (formData.password !== formData.confirm) {
      errors.confirm = 'パスワードが一致しません';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('');
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await apiRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirm,
        phone: formData.phone || undefined,
        sex: formData.sex || undefined,
        registerAddress: formData.registerAddress,
        postalCode: formData.registerAddress ? formData.postalCode : undefined,
        prefecture: formData.registerAddress ? formData.prefecture : undefined,
        address: formData.registerAddress ? formData.address : undefined,
        option: formData.registerAddress ? formData.option : undefined,
      });

      if (response.success) {
        setStep('done');
      } else {
        setError(response.message || 'ユーザー登録に失敗しました');
        setStep('form');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('ユーザー登録に失敗しました。時間をおいて再度お試しください。');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>アカウント登録</h1>
        {step === 'form' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>基本情報</legend>

              <TextInput
                label="お名前"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例：山田 太郎"
                inputType="text"
                required
                error={fieldErrors.name}
                containerStyle={{ marginBottom: '16px' }}
              />
              <TextInput
                label="メールアドレス"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="例：sample@example.com"
                inputType="text"
                required
                error={fieldErrors.email}
                containerStyle={{ marginBottom: '16px' }}
              />
              <div className={styles.formGroup}>
                <label className={styles.label}>パスワード</label>
                <input
                  className={styles.input}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {fieldErrors.password && (
                  <div
                    style={{
                      color: '#e74c3c',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  >
                    {fieldErrors.password}
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>パスワード（確認）</label>
                <input
                  className={styles.input}
                  type="password"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleInputChange}
                />
                {fieldErrors.confirm && (
                  <div
                    style={{
                      color: '#e74c3c',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  >
                    {fieldErrors.confirm}
                  </div>
                )}
              </div>
              <TextInput
                label="電話番号"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="例：090-1234-5678"
                inputType="text"
                error={fieldErrors.phone}
                containerStyle={{ marginBottom: '16px' }}
              />
              <div className={styles.formGroup}>
                <label className={styles.label}>性別</label>
                <Dropdown
                  isOpen={isGenderDropdownOpen}
                  onToggle={() =>
                    setIsGenderDropdownOpen(!isGenderDropdownOpen)
                  }
                  onClose={() => setIsGenderDropdownOpen(false)}
                  buttonText={
                    genderOptions.find((opt) => opt.id === formData.sex)
                      ?.label || '選択してください'
                  }
                >
                  {genderOptions.map((option) => (
                    <div
                      key={option.id}
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          sex: option.id,
                        }));
                        setIsGenderDropdownOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                    </div>
                  ))}
                </Dropdown>
              </div>
            </fieldset>

            {/* 住所登録チェックボックス */}
            <div
              className={styles.checkboxContainer}
              style={{ marginBottom: '16px' }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  name="registerAddress"
                  checked={formData.registerAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      registerAddress: e.target.checked,
                    }))
                  }
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  住所情報を登録する（任意）
                </span>
              </label>
            </div>

            {/* 住所情報フィールド - チェックボックスがONの時だけ表示 */}
            {formData.registerAddress && (
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>住所情報</legend>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <TextInput
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="1234567"
                      label="郵便番号"
                      inputType="number"
                      maxLength={7}
                      required={formData.registerAddress}
                      error={fieldErrors.postalCode}
                      containerStyle={{ marginBottom: '0px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearchingAddress}
                    onMouseEnter={(e) => {
                      if (!isSearchingAddress) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#fff',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: isSearchingAddress ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      opacity: isSearchingAddress ? 0.6 : 1,
                      transition: 'background-color 0.2s',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '28px',
                    }}
                  >
                    {isSearchingAddress ? '検索中...' : '住所検索'}
                  </button>
                </div>
                {addressSearchError && (
                  <div
                    style={{
                      color: '#c33',
                      fontSize: '12px',
                      marginTop: '4px',
                      marginBottom: '16px',
                    }}
                  >
                    {addressSearchError}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    都道府県<span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <Dropdown
                    isOpen={isPrefectureDropdownOpen}
                    onToggle={() =>
                      setIsPrefectureDropdownOpen(!isPrefectureDropdownOpen)
                    }
                    onClose={() => setIsPrefectureDropdownOpen(false)}
                    buttonText={
                      prefectureOptions.find(
                        (opt) => opt.id === formData.prefecture
                      )?.label || '選択してください'
                    }
                  >
                    {prefectureOptions.map((option) => (
                      <div
                        key={option.id}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            prefecture: option.id,
                          }));
                          setIsPrefectureDropdownOpen(false);
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {option.label}
                        </span>
                      </div>
                    ))}
                  </Dropdown>
                </div>
                {fieldErrors.prefecture && (
                  <div
                    style={{
                      color: '#e74c3c',
                      fontSize: '12px',
                      marginTop: '4px',
                      marginBottom: '16px',
                    }}
                  >
                    {fieldErrors.prefecture}
                  </div>
                )}

                <TextInput
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="丸の内1-1-1"
                  label="住所"
                  inputType="text"
                  required
                  error={fieldErrors.address}
                  containerStyle={{ marginBottom: '16px' }}
                />

                <TextInput
                  name="option"
                  value={formData.option}
                  onChange={handleInputChange}
                  placeholder="◇◇ビル 4階"
                  label="建物名・その他（オプション）"
                  inputType="text"
                  containerStyle={{ marginBottom: '16px' }}
                />
              </fieldset>
            )}
            {error && <div className={styles.error}>{error}</div>}
            <button className={styles.submitButton} type="submit">
              登録内容を確認
            </button>
          </form>
        )}
        {step === 'confirm' && (
          <div className={styles.confirmBox}>
            <h2>入力内容の確認</h2>
            <div className={styles.confirmRow}>
              <span>お名前</span>
              <span>{formData.name}</span>
            </div>
            <div className={styles.confirmRow}>
              <span>メールアドレス</span>
              <span>{formData.email}</span>
            </div>
            <div className={styles.confirmRow}>
              <span>電話番号</span>
              <span>{formData.phone || '-'}</span>
            </div>
            <div className={styles.confirmRow}>
              <span>性別</span>
              <span>
                {genderOptions.find((opt) => opt.id === formData.sex)?.label ||
                  '-'}
              </span>
            </div>
            {formData.registerAddress && (
              <>
                <div className={styles.confirmRow}>
                  <span>郵便番号</span>
                  <span>〒{formData.postalCode}</span>
                </div>
                <div className={styles.confirmRow}>
                  <span>都道府県</span>
                  <span>
                    {prefectureOptions.find(
                      (opt) => opt.id === formData.prefecture
                    )?.label || '-'}
                  </span>
                </div>
                <div className={styles.confirmRow}>
                  <span>住所</span>
                  <span>{formData.address}</span>
                </div>
                {formData.option && (
                  <div className={styles.confirmRow}>
                    <span>建物名・その他</span>
                    <span>{formData.option}</span>
                  </div>
                )}
              </>
            )}
            <div className={styles.confirmActions}>
              <button className={styles.submitButton} onClick={handleConfirm}>
                登録
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setStep('form')}
              >
                戻る
              </button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className={styles.doneBox}>
            <div className={styles.checkIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#4caf50" />
                <path
                  d="M14 25l7 7 13-13"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>メール送信しました</h2>
            <p style={{ marginTop: '5px' }}>
              ご登録のメールアドレス宛に確認メールを送信しました。
              <br />
              メールをご確認のうえ、認証手続きを完了してください。
            </p>
            <div
              style={{
                backgroundColor: '#fef3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                color: '#856404',
                marginTop: '16px',
              }}
            >
              <strong>ご確認ください</strong>
              <ul style={{ margin: '8px 0 0 16px', paddingLeft: '8px' }}>
                <li>
                  メールが届かない場合、迷惑メール（スパム）フォルダをご確認ください
                </li>
                <li>
                  @marksports.com
                  ドメインをメール設定でブロックしている場合はご解除ください
                </li>
              </ul>
            </div>
            <button
              className={styles.submitButton}
              onClick={() => router.push('/')}
            >
              ホームへ
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
