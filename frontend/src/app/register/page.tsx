'use client';

import MainLayout from '@/components/Layout/MainLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  register as apiRegister,
  verifyEmail,
  resendVerificationEmail,
} from '@/api/register';
import { useLoading } from '@/context/LoadingContext';
import { TextInput } from '@/components/Input/TextInput';
import { searchAddressByPostalCode } from '@/api/address';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<
    'form' | 'confirm' | 'verification' | 'done'
  >('form');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(
    null,
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
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
    >,
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
        // メール認証が必要に変更
        setStep('verification');
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
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h4" fontWeight={700}>
          アカウント登録
        </Typography>

        {step === 'form' && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              display="flex"
              flexDirection="column"
              gap={3}
            >
              <Typography variant="h6" fontWeight={700}>
                基本情報
              </Typography>
              <Stack spacing={2}>
                <TextInput
                  label="お名前"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="例：山田 太郎"
                  inputType="text"
                  required
                  error={fieldErrors.name}
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
                />
                <TextInput
                  label="パスワード"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="パスワード"
                  inputType="password"
                  required
                  error={fieldErrors.password}
                />
                <TextInput
                  label="パスワード（確認）"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleInputChange}
                  placeholder="パスワード（確認）"
                  inputType="password"
                  required
                  error={fieldErrors.confirm}
                />
                <TextInput
                  label="電話番号"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="例：090-1234-5678"
                  inputType="text"
                  error={fieldErrors.phone}
                />
                <FormControl fullWidth>
                  <InputLabel id="sex-label">性別</InputLabel>
                  <Select
                    labelId="sex-label"
                    label="性別"
                    value={formData.sex}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sex: String(e.target.value),
                      }))
                    }
                  >
                    {genderOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Divider />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.registerAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        registerAddress: e.target.checked,
                      }))
                    }
                  />
                }
                label="住所情報を登録する（任意）"
              />

              {formData.registerAddress && (
                <Box display="flex" flexDirection="column" gap={2}>
                  <Typography variant="h6" fontWeight={700}>
                    住所情報
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="flex-end"
                  >
                    <Box flex={1}>
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
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={handleSearchAddress}
                      disabled={isSearchingAddress}
                    >
                      {isSearchingAddress ? '検索中...' : '住所検索'}
                    </Button>
                  </Stack>
                  {addressSearchError && (
                    <Alert severity="error">{addressSearchError}</Alert>
                  )}

                  <FormControl
                    fullWidth
                    error={Boolean(fieldErrors.prefecture)}
                  >
                    <InputLabel id="prefecture-label">都道府県</InputLabel>
                    <Select
                      labelId="prefecture-label"
                      label="都道府県"
                      value={formData.prefecture}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          prefecture: String(e.target.value),
                        }))
                      }
                    >
                      {prefectureOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldErrors.prefecture && (
                      <Typography variant="caption" color="error">
                        {fieldErrors.prefecture}
                      </Typography>
                    )}
                  </FormControl>

                  <TextInput
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="丸の内1-1-1"
                    label="住所"
                    inputType="text"
                    required
                    error={fieldErrors.address}
                  />

                  <TextInput
                    name="option"
                    value={formData.option}
                    onChange={handleInputChange}
                    placeholder="◇◇ビル 4階"
                    label="建物名・その他（オプション）"
                    inputType="text"
                  />
                </Box>
              )}

              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained">
                登録内容を確認
              </Button>
            </Box>
          </Paper>
        )}

        {step === 'confirm' && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              入力内容の確認
            </Typography>
            <Stack spacing={1}>
              {[
                ['お名前', formData.name],
                ['メールアドレス', formData.email],
                ['電話番号', formData.phone || '-'],
                [
                  '性別',
                  genderOptions.find((opt) => opt.id === formData.sex)?.label ||
                    '-',
                ],
              ].map(([label, value]) => (
                <Box key={label} display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography>{value}</Typography>
                </Box>
              ))}
              {formData.registerAddress && (
                <>
                  <Divider sx={{ my: 1 }} />
                  {[
                    ['郵便番号', `〒${formData.postalCode}`],
                    [
                      '都道府県',
                      prefectureOptions.find(
                        (opt) => opt.id === formData.prefecture,
                      )?.label || '-',
                    ],
                    ['住所', formData.address],
                    ...(formData.option
                      ? [['建物名・その他', formData.option]]
                      : []),
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Typography color="text.secondary">{label}</Typography>
                      <Typography>{value}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
              <Button variant="contained" onClick={handleConfirm}>
                登録
              </Button>
              <Button variant="outlined" onClick={() => setStep('form')}>
                戻る
              </Button>
            </Stack>
          </Paper>
        )}

        {step === 'verification' && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2} alignItems="center">
              <MarkEmailReadIcon color="primary" sx={{ fontSize: 56 }} />
              <Typography variant="h6" fontWeight={700}>
                メールアドレス認証
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                {formData.email}{' '}
                に送信された認証メール内のリンクをクリックしてください。
              </Typography>

              <Alert severity="info" sx={{ width: '100%' }}>
                <Typography fontWeight={700}>ご確認ください</Typography>
                <List dense>
                  {[
                    'メールが届かない場合は、迷惑メール（スパム）フォルダをご確認ください',
                    '@mark-sports.com ドメインをメール設定でブロックしている場合はご解除ください',
                    '認証リンクは24時間有効です',
                  ].map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Alert>

              {verificationError && (
                <Alert severity="error">{verificationError}</Alert>
              )}
              {resendSuccess && (
                <Alert severity="success">
                  認証メールを再送信しました。メールをご確認ください。
                </Alert>
              )}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                width="100%"
              >
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      setIsResendingEmail(true);
                      setVerificationError('');
                      setResendSuccess(false);
                      const response = await resendVerificationEmail({
                        email: formData.email,
                      });
                      if (response.success) {
                        setResendSuccess(true);
                      } else {
                        setVerificationError(
                          response.message || 'メール再送に失敗しました',
                        );
                      }
                    } catch (err) {
                      console.error('Resend error:', err);
                      setVerificationError(
                        'メール再送に失敗しました。時間をおいて再度お試しください。',
                      );
                    } finally {
                      setIsResendingEmail(false);
                    }
                  }}
                  disabled={isResendingEmail}
                  fullWidth
                >
                  {isResendingEmail ? '送信中...' : 'メール再送'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setStep('form');
                    setVerificationCode('');
                    setVerificationError('');
                    setResendSuccess(false);
                  }}
                  fullWidth
                >
                  キャンセル
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {step === 'done' && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2} alignItems="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
              <Typography variant="h6" fontWeight={700}>
                メール送信しました
              </Typography>
              <Typography textAlign="center" color="text.secondary">
                ご登録のメールアドレス宛に確認メールを送信しました。
                <br />
                メールをご確認のうえ、認証手続きを完了してください。
              </Typography>
              <Alert severity="warning" sx={{ width: '100%' }}>
                <Typography fontWeight={700}>ご確認ください</Typography>
                <List dense>
                  {[
                    'メールが届かない場合、迷惑メール（スパム）フォルダをご確認ください',
                    '@marksports.com ドメインをメール設定でブロックしている場合はご解除ください',
                  ].map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                fullWidth
              >
                ホームへ
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}
