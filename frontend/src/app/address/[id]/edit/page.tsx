'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import { TextInput } from '@/components/Input/TextInput';
import Link from 'next/link';
import {
  getAddresses,
  updateAddress,
  deleteAddress,
  searchAddressByPostalCode,
} from '@/api/address';
import styles from './edit.module.css';

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

const prefectureMap: Record<string, string> = prefectureOptions.reduce(
  (acc, opt) => {
    acc[opt.label] = opt.id;
    return acc;
  },
  {} as Record<string, string>
);

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = params.id as string;
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [address, setAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    postalCode: '',
    prefecture: '',
    address: '',
    option: '',
  });
  const [isPrefectureDropdownOpen, setIsPrefectureDropdownOpen] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const response = await getAddresses();
        if (response.success && response.data) {
          const foundAddress = response.data.find((a) => a.id === addressId);
          if (foundAddress) {
            setAddress(foundAddress);
            setFormData({
              postalCode: foundAddress.postalCode,
              prefecture: foundAddress.prefecture,
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
  }, [addressId]);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>配送先住所編集</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <p>読み込み中...</p>
        </div>
      </MainLayout>
    );
  }

  if (!address) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>配送先住所編集</h1>
            <p>住所が見つかりません</p>
            <Link href="/address" className={styles.backButton}>
              配送先住所管理に戻る
            </Link>
          </div>
        </div>
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
          ([key, val]) => key === response.data?.prefecture
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
      const response = await updateAddress(addressId, {
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
        const response = await deleteAddress(addressId);

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
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <Link href="/address">配送先住所管理</Link>
          <span>/</span>
          <span>編集</span>
        </div>

        <h1 className={styles.title}>配送先住所を編集</h1>

        <form className={styles.form}>
          <div className={styles.formGroup}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1 }}>
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
              </div>
              <button
                type="button"
                className={styles.searchButton}
                onClick={handleSearchPostalCode}
              >
                検索
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              都道府県 <span className={styles.required}>*</span>
            </label>
            <Dropdown
              isOpen={isPrefectureDropdownOpen}
              onToggle={() =>
                setIsPrefectureDropdownOpen(!isPrefectureDropdownOpen)
              }
              onClose={() => setIsPrefectureDropdownOpen(false)}
              buttonText={
                prefectureOptions.find((opt) => opt.id === formData.prefecture)
                  ?.label || '選択してください'
              }
            >
              {prefectureOptions.map((option) => (
                <div
                  key={option.id}
                  className={styles.dropdownOption}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      prefecture: option.id,
                    }));
                    setIsPrefectureDropdownOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </Dropdown>
            {fieldErrors.prefecture && (
              <span className={styles.fieldError}>
                {fieldErrors.prefecture}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <TextInput
              label="住所"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="例：東京都渋谷区1-2-3"
              error={fieldErrors.address}
            />
          </div>

          <div className={styles.formGroup}>
            <TextInput
              label="建物名・部屋番号（オプション）"
              name="option"
              value={formData.option || ''}
              onChange={handleInputChange}
              placeholder="例：○○ビル 101号室"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
            >
              更新する
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
            >
              削除
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
