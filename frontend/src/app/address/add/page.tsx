'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import { TextInput } from '@/components/Input/TextInput';
import Link from 'next/link';
import { addAddress, searchAddressByPostalCode } from '@/api/address';
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
} from '@mui/material';

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

export default function AddAddressPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<AddressFormData>({
    postalCode: '',
    prefecture: '',
    address: '',
    option: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            配送先住所追加
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
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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
      const response = await addAddress({
        postalCode: formData.postalCode,
        prefecture: formData.prefecture,
        address: formData.address,
        option: formData.option || undefined,
      });

      if (response.success) {
        showSnackbar('住所を追加しました', 'success');
        setTimeout(() => {
          router.push('/address');
        }, 500);
      } else {
        showSnackbar('住所の追加に失敗しました', 'error');
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
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
          <Typography color="text.primary">追加</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          新しい配送先住所を追加
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

          <Button variant="contained" onClick={handleSubmit}>
            追加する
          </Button>
        </Box>
      </Box>
    </MainLayout>
  );
}
