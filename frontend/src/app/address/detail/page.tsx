'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import { TextInput } from '@/components/Input/TextInput';
import {
  getAddresses,
  updateAddress,
  deleteAddress,
  searchAddressByPostalCode,
} from '@/api/address';
import { PREFECTURE_OPTIONS } from '@/constants/prefectures';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
  CircularProgress,
} from '@mui/material';

interface Address {
  id: string;
  postalCode: string;
  prefecture: string;
  address: string;
  option?: string;
  isMain?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AddressFormData {
  postalCode: string;
  prefecture: string;
  address: string;
  option?: string;
}

const prefectureOptions = PREFECTURE_OPTIONS;

const prefectureMap: Record<string, string> = prefectureOptions.reduce(
  (acc, opt) => {
    acc[opt.label] = opt.id;
    return acc;
  },
  {} as Record<string, string>,
);

export default function AddressDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('id');

  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [address, setAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    postalCode: '',
    prefecture: '',
    address: '',
    option: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAddress = async () => {
      try {
        if (!addressId) {
          showSnackbar('住所 ID が見つかりません', 'error');
          setIsLoading(false);
          return;
        }

        const response = await getAddresses();
        if (response.success && response.data) {
          const foundAddress = response.data.find((a) => a.id === addressId);
          if (foundAddress) {
            setAddress(foundAddress);
            // prefectureが日本語で保存されている場合、IDに変換
            const prefectureId =
              prefectureMap[foundAddress.prefecture] || foundAddress.prefecture;
            setFormData({
              postalCode: foundAddress.postalCode,
              prefecture: prefectureId,
              address: foundAddress.address,
              option: foundAddress.option || '',
            });
          } else {
            showSnackbar('住所が見つかりません', 'error');
          }
        }
      } catch (err) {
        console.error('Failed to load address:', err);
        showSnackbar('住所の読み込みに失敗しました', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAddress();
  }, [addressId, showSnackbar]);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            配送先住所編集
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            ログインしていません
          </Typography>
          <Button variant="outlined" component={Link} href="/">
            ホームへ戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!address) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            配送先住所編集
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            住所が見つかりません
          </Typography>
          <Button variant="outlined" component={Link} href="/address">
            配送先住所管理に戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.postalCode) {
      errors.postalCode = '郵便番号を入力してください';
    } else if (!/^\d{7}$/.test(formData.postalCode)) {
      errors.postalCode = '郵便番号は7桁の数字で入力してください';
    }

    if (!formData.prefecture) {
      errors.prefecture = '都道府県を選択してください';
    }

    if (!formData.address) {
      errors.address = '住所を入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

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

  const handleSearchPostalCode = async () => {
    if (!formData.postalCode) {
      setFieldErrors({
        ...fieldErrors,
        postalCode: '郵便番号を入力してください',
      });
      return;
    }
    if (!/^\d{7}$/.test(formData.postalCode)) {
      setFieldErrors({
        ...fieldErrors,
        postalCode: '郵便番号は7桁の数字で入力してください',
      });
      return;
    }

    try {
      const response = await searchAddressByPostalCode(formData.postalCode);

      if (response.success && response.data) {
        const prefectureId = Object.entries(prefectureMap).find(
          ([key, val]) => key === response.data?.prefecture,
        )?.[1];

        setFormData((prev) => ({
          ...prev,
          prefecture: prefectureId || prev.prefecture,
          address: response.data?.address || prev.address,
        }));
        showSnackbar('住所情報を取得しました', 'success');
      } else {
        showSnackbar(response.message || '住所が見つかりませんでした', 'error');
      }
    } catch (err) {
      console.error('Error searching address:', err);
      showSnackbar('住所検索に失敗しました', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await updateAddress(addressId!, {
        postalCode: formData.postalCode,
        prefecture: formData.prefecture,
        address: formData.address,
        option: formData.option || undefined,
      });

      if (response.success) {
        showSnackbar('住所を更新しました', 'success');
        setTimeout(() => {
          router.push('/address');
        }, 500);
      } else {
        showSnackbar('住所の更新に失敗しました', 'error');
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    }
  };

  const handleDelete = async () => {
    if (
      confirm('この住所を削除してもよろしいですか？削除すると復元できません。')
    ) {
      try {
        const response = await deleteAddress(addressId!);

        if (response.success) {
          showSnackbar('住所を削除しました', 'success');
          setTimeout(() => {
            router.push('/address');
          }, 500);
        } else {
          showSnackbar('住所の削除に失敗しました', 'error');
        }
      } catch (err) {
        showSnackbar('エラーが発生しました', 'error');
        console.error('Error:', err);
      }
    }
  };

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href="/account" color="inherit">
            アカウント
          </MuiLink>
          <MuiLink component={Link} href="/address" color="inherit">
            配送先住所管理
          </MuiLink>
          <Typography color="text.primary">編集</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          配送先住所を編集
        </Typography>

        <Box
          component="form"
          display="flex"
          flexDirection="column"
          gap={2}
          noValidate
        >
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <Box flex={1}>
              <TextInput
                label="郵便番号"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="1234567"
                inputType="number"
                maxLength={7}
                error={fieldErrors.postalCode}
              />
            </Box>
            <Button variant="outlined" onClick={handleSearchPostalCode}>
              検索
            </Button>
          </Stack>

          <FormControl fullWidth error={Boolean(fieldErrors.prefecture)}>
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
              <FormHelperText>{fieldErrors.prefecture}</FormHelperText>
            )}
          </FormControl>

          <TextInput
            label="住所"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="例：東京都渋谷区1-2-3"
            error={fieldErrors.address}
          />

          <TextInput
            label="建物名・部屋番号（オプション）"
            name="option"
            value={formData.option || ''}
            onChange={handleInputChange}
            placeholder="例：○○ビル 101号室"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" onClick={handleSubmit}>
              更新する
            </Button>
            <Button variant="outlined" color="error" onClick={handleDelete}>
              削除
            </Button>
          </Stack>
        </Box>
      </Box>
    </MainLayout>
  );
}
