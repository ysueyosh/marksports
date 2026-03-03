'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminShippingSettings,
  updateAdminShippingSettings,
  ShippingSettings,
} from '@/api/admin-shipping';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  TextField,
} from '@mui/material';

const defaultSettings: ShippingSettings = {
  baseFee: 500,
  freeShippingThreshold: 4000,
  regionSurcharges: {
    hokkaido: 0,
    tohoku: 0,
    chubuKanto: 0,
    chugokuKansai: 0,
    kyushu: 0,
    okinawa: 0,
  },
};

export default function AdminShippingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>(defaultSettings);
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        const adminLogged = localStorage.getItem('adminLogged');
        if (!adminLogged) {
          router.push('/admin/login');
          return;
        }

        setIsLoggedIn(true);
        const response = await getAdminShippingSettings();

        if (response.success && response.data) {
          setShippingSettings(response.data);
        } else {
          setError('送料設定の取得に失敗しました');
        }
      } catch (fetchError) {
        console.error('Failed to fetch shipping settings:', fetchError);
        setError('送料設定の取得に失敗しました');
      }
    };

    fetchShippingSettings();
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  const handleSaveShipping = async () => {
    const errors: Record<string, string> = {};
    const { baseFee, regionSurcharges } = shippingSettings;

    if (baseFee < 0) {
      errors.baseFee = '0以上の数値を入力してください';
    }

    (Object.entries(regionSurcharges) as [string, number][]).forEach(
      ([key, value]) => {
        if (value < 0) {
          errors[`regionSurcharges.${key}`] = '0以上の数値を入力してください';
        }
      },
    );

    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors);
      setError('');
      return;
    }

    setShippingErrors({});

    try {
      setIsSaving(true);
      const response = await updateAdminShippingSettings({
        baseFee: shippingSettings.baseFee,
        regionSurcharges: shippingSettings.regionSurcharges,
      });

      if (response.success && response.data) {
        setShippingSettings(response.data);
        setSuccess('送料設定を更新しました');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || '送料設定の更新に失敗しました');
      }
    } catch (saveError) {
      console.error('Failed to update shipping settings:', saveError);
      setError('送料設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Button
          component={Link}
          href="/admin/home"
          variant="outlined"
          sx={{ width: 'fit-content' }}
        >
          ← 戻る
        </Button>

        <Typography variant="h4" fontWeight={700}>
          送料設定
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveShipping();
            }}
            display="flex"
            flexDirection="column"
            gap={2}
            noValidate
          >
            <Typography variant="subtitle1" fontWeight={700}>
              基本設定
            </Typography>
            <TextField
              label="基本送料 (円)"
              type="number"
              value={shippingSettings.baseFee}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  baseFee: Number(e.target.value),
                })
              }
              error={Boolean(shippingErrors.baseFee)}
              helperText={
                shippingErrors.baseFee || '4,000円未満で適用される送料'
              }
              required
              inputProps={{ min: 0 }}
            />

            <Typography variant="body2" color="text.secondary">
              4,000円以上は基本送料が無料になります（地域追加送料は常に適用）。
            </Typography>

            <Typography variant="subtitle1" fontWeight={700} mt={3}>
              地域別追加送料
            </Typography>

            <TextField
              label="九州 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.kyushu}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    kyushu: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.kyushu'])}
              helperText={shippingErrors['regionSurcharges.kyushu']}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="中国・関西 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.chugokuKansai}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    chugokuKansai: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.chugokuKansai'])}
              helperText={shippingErrors['regionSurcharges.chugokuKansai']}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="中部・関東 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.chubuKanto}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    chubuKanto: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.chubuKanto'])}
              helperText={shippingErrors['regionSurcharges.chubuKanto']}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="東北 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.tohoku}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    tohoku: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.tohoku'])}
              helperText={shippingErrors['regionSurcharges.tohoku']}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="北海道 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.hokkaido}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    hokkaido: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.hokkaido'])}
              helperText={shippingErrors['regionSurcharges.hokkaido']}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="沖縄 (円)"
              type="number"
              value={shippingSettings.regionSurcharges.okinawa}
              onChange={(e) =>
                setShippingSettings({
                  ...shippingSettings,
                  regionSurcharges: {
                    ...shippingSettings.regionSurcharges,
                    okinawa: Number(e.target.value),
                  },
                })
              }
              error={Boolean(shippingErrors['regionSurcharges.okinawa'])}
              helperText={shippingErrors['regionSurcharges.okinawa']}
              inputProps={{ min: 0 }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '送料設定を保存'}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
