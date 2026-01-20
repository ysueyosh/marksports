'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay,
} from 'react-square-web-payments-sdk';
import CheckoutLayout from '@/components/Layout/CheckoutLayout';
import { submitPayment } from '@/app/actions/actions';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePaymentMethod } from '@/context/PaymentMethodContext';
import { getPriceWithTax } from '@/utils/price';
import {
  searchAddressByPostalCode,
  getAddresses,
  addAddress,
  AddressItem,
} from '@/api/address';
import TextInput from '@/components/Input/TextInput';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { items: cartItems, clear: clearCart, coupon } = useCart();
  const { paymentMethods, addPaymentMethod } = usePaymentMethod();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<
    'credit_card' | 'bank_transfer' | 'apple_pay' | 'google_pay' | null
  >(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [isPrefectureDropdownOpen, setIsPrefectureDropdownOpen] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userAddresses, setUserAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressError, setNewAddressError] = useState<string | null>(null);
  const [newAddressFormData, setNewAddressFormData] = useState({
    postalCode: '',
    prefecture: '',
    address: '',
    option: '',
  });
  const [isPrefectureDropdownOpenInModal, setIsPrefectureDropdownOpenInModal] =
    useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    address: '',
    building: '',
  });

  // 金額計算（税率10%を仮定）
  const TAX_RATE = 0.1;
  const SHIPPING_FEE_NORMAL = 500; // 通常配送料金

  // 金額計算のメモ化
  const priceInfo = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingFee = SHIPPING_FEE_NORMAL;
    // 消費税は商品代金にのみかかる（送料は税抜き）
    const tax = Math.floor(subtotal * TAX_RATE);
    // 税込み小計（商品代金 + 消費税）
    const subtotalWithTax = subtotal + tax;

    // クーポン割引額を動的に計算
    let discountAmount = 0;
    if (coupon) {
      const couponTargetAmount = subtotalWithTax;
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.floor(
          (couponTargetAmount * coupon.discount_value) / 100
        );
        // 最高割引額でキャップ
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }
      } else if (coupon.discount_type === 'amount') {
        // amount型：固定額割引
        discountAmount = Math.min(coupon.discount_value, couponTargetAmount);
      }
    }

    const total = subtotal + shippingFee + tax - discountAmount;

    return {
      subtotal,
      subtotalWithTax,
      shippingFee,
      tax,
      discountAmount,
      total,
    };
  }, [cartItems, coupon]);

  // ログイン状態で情報を自動入力
  useEffect(() => {
    if (isLoggedIn && user) {
      // 名前のフルネームを分割（簡易版：スペースで分割、またはデータがあればそれを使用）
      const firstName =
        user.shippingAddress?.firstName ||
        (user.name ? user.name.split(' ')[0] : '');
      const lastName =
        user.shippingAddress?.lastName ||
        (user.name ? user.name.split(' ').slice(1).join(' ') : '');

      setFormData((prev) => ({
        ...prev,
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        phone: user.shippingAddress?.phone || user.phone || '',
        postalCode: user.shippingAddress?.postalCode || '',
        prefecture: user.shippingAddress?.prefecture || '',
        address: user.shippingAddress?.address || '',
        building: user.shippingAddress?.building || '',
      }));

      // ログインユーザーの場合、住所一覧を取得
      const loadAddresses = async () => {
        try {
          setIsLoadingAddresses(true);
          const response = await getAddresses();
          if (response.success && response.data) {
            setUserAddresses(response.data);
            // デフォルトではメイン住所を選択
            const mainAddress = response.data.find((addr) => addr.isMain);
            if (mainAddress) {
              setSelectedAddressId(mainAddress.id);
            } else if (response.data.length > 0) {
              setSelectedAddressId(response.data[0].id);
            }
          }
        } catch (error) {
          console.error('Failed to load addresses:', error);
        } finally {
          setIsLoadingAddresses(false);
        }
      };

      loadAddresses();
    }
  }, [isLoggedIn, user]);

  // ログイン状態に応じてカード選択を初期化
  useEffect(() => {
    if (isLoggedIn) {
      setSelectedPaymentMethodId('sandbox_4111');
    } else {
      setSelectedPaymentMethodId('new_card');
    }
  }, [isLoggedIn]);

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

  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(
    null
  );
  const [isSearchingAddressInModal, setIsSearchingAddressInModal] =
    useState(false);
  const [addressSearchErrorInModal, setAddressSearchErrorInModal] = useState<
    string | null
  >(null);

  const handleSearchAddress = async () => {
    const postalCode = formData.postalCode.trim();

    // 郵便番号が空またはフォーマットが正しくない場合は表示
    if (!postalCode) {
      setAddressSearchError('郵便番号を入力してください');
      return;
    }

    if (!/^\d{7}$/.test(postalCode)) {
      setAddressSearchError('郵便番号は7桁の数字で入力してください');
      return;
    }

    setIsSearchingAddress(true);
    setAddressSearchError(null);

    try {
      const response = await searchAddressByPostalCode(postalCode);

      if (response.success && response.data) {
        // 日本語都道府県県名をマッピング
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
    }
  };

  const handleSearchAddressInModal = async () => {
    const postalCode = newAddressFormData.postalCode.trim();

    if (!postalCode) {
      setAddressSearchErrorInModal('郵便番号を入力してください');
      return;
    }

    if (postalCode.length !== 7) {
      setAddressSearchErrorInModal('郵便番号は7文字である必要があります');
      return;
    }

    setIsSearchingAddressInModal(true);
    setAddressSearchErrorInModal(null);

    try {
      const result = await searchAddressByPostalCode(postalCode);

      if (result.success && result.data) {
        // prefectureは日本語名なので、prefectureOptionsから該当するIDを探す
        const prefectureId = prefectureOptions.find(
          (opt) => opt.label === result.data!.prefecture
        )?.id;

        if (prefectureId) {
          handleNewAddressFormChange('prefecture', prefectureId);
        }
        handleNewAddressFormChange('address', result.data.address);
      } else {
        setAddressSearchErrorInModal(
          result.message || '指定の郵便番号が見つかりません'
        );
      }
    } catch (error) {
      console.error('Failed to search address:', error);
      setAddressSearchErrorInModal('住所の検索に失敗しました');
    } finally {
      setIsSearchingAddressInModal(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // 郵便番号の場合、数字のみを許可
    if (name === 'postalCode') {
      // 数字のみを抽出
      const digitsOnly = value.replace(/\D/g, '');
      // 最大7文字まで
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

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setPaymentError(null);
    }
  };

  const handleConfirmStep = () => {
    setCurrentStep(3);
    setPaymentError(null);
  };

  const handleAddNewAddress = async () => {
    if (
      !newAddressFormData.postalCode ||
      !newAddressFormData.prefecture ||
      !newAddressFormData.address
    ) {
      setNewAddressError('必須項目を入力してください');
      return;
    }

    setIsAddingAddress(true);
    try {
      const response = await addAddress({
        postalCode: newAddressFormData.postalCode,
        prefecture: newAddressFormData.prefecture,
        address: newAddressFormData.address,
        option: newAddressFormData.option || undefined,
      });

      if (response.success && response.data) {
        // モーダルを閉じ、新しい住所を選択状態にする
        setIsAddressModalOpen(false);
        setSelectedAddressId(response.data.id);
        setUseNewAddress(false);

        // 住所リストを更新
        setUserAddresses([...userAddresses, response.data]);

        // フォーム履歴から削除
        setNewAddressFormData({
          postalCode: '',
          prefecture: '',
          address: '',
          option: '',
        });
        setNewAddressError(null);
      } else {
        setNewAddressError(response.message || '住所の追加に失敗しました');
      }
    } catch (error) {
      setNewAddressError('住所の追加中にエラーが発生しました');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleNewAddressFormChange = (field: string, value: string) => {
    setNewAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    // Always validate basic contact info
    if (!formData.firstName) errors.firstName = '姓を入力してください';
    if (!formData.lastName) errors.lastName = '名を入力してください';
    if (!formData.email) errors.email = 'メールアドレスを入力してください';
    if (!formData.phone) errors.phone = '電話番号を入力してください';

    // For logged-in users with saved addresses: validate selected address or new address
    if (isLoggedIn && userAddresses.length > 0) {
      if (useNewAddress) {
        // Using new address: validate address fields
        if (!formData.postalCode)
          errors.postalCode = '郵便番号を入力してください';
        if (!formData.prefecture)
          errors.prefecture = '都道府県を選択してください';
        if (!formData.address) errors.address = '住所を入力してください';
      } else {
        // Using saved address: validate selection
        if (!selectedAddressId) {
          errors.addressSelection = '配送先住所を選択してください';
        }
      }
    } else {
      // For non-logged-in users or when no saved addresses: validate address fields
      if (!formData.postalCode)
        errors.postalCode = '郵便番号を入力してください';
      if (!formData.prefecture)
        errors.prefecture = '都道府県を選択してください';
      if (!formData.address) errors.address = '住所を入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPaymentError(null);
      return false;
    }

    // メールアドレスの形式確認
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFieldErrors({ email: '有効なメールアドレスを入力してください' });
      setPaymentError(null);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handlePayment = async (sourceId?: string) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let paymentSourceId: string;

      // 支払い方法ごとの処理
      switch (paymentMode) {
        case 'credit_card':
          if (!sourceId) {
            setPaymentError('カード情報を入力してください');
            setIsProcessing(false);
            return;
          }
          paymentSourceId = sourceId;
          break;

        case 'bank_transfer':
          // 口座振込は即座に完了
          paymentSourceId = `bank_${Date.now()}`;
          break;

        case 'apple_pay':
          // Apple Pay のトークン取得処理
          paymentSourceId = `apple_pay_${Date.now()}`;
          break;

        case 'google_pay':
          // Google Pay のトークン取得処理
          paymentSourceId = `google_pay_${Date.now()}`;
          break;

        default:
          setPaymentError('支払い方法を選択してください');
          setIsProcessing(false);
          return;
      }

      const result = await submitPayment({
        sourceId: paymentSourceId,
        amount: priceInfo.total,
        currency: 'JPY',
        orderId: `ORDER_${Date.now()}`,
      });

      if (result && result.id) {
        clearCart();
        setCurrentStep(4);
      } else {
        setPaymentError('決済処理中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : '決済処理中にエラーが発生しました'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout>
      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        <button className={styles.navButton} onClick={() => router.push('/')}>
          ← トップに戻る
        </button>
        {currentStep !== 4 && (
          <button
            className={styles.navButton}
            onClick={() => router.push('/cart')}
          >
            ← カートに戻る
          </button>
        )}
      </div>

      {currentStep !== 4 && (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>注文手続き</h1>
            <p>買い物を完成させましょう</p>
          </div>

          <div className={styles.steps}>
            <div
              className={`${styles.step} ${
                currentStep >= 1 ? styles.active : ''
              }`}
            >
              <span className={styles.stepNumber}>1</span>
              <span>配送情報入力</span>
            </div>
            <div
              className={`${styles.step} ${
                currentStep >= 2 ? styles.active : ''
              }`}
            >
              <span className={styles.stepNumber}>2</span>
              <span>注文内容確認</span>
            </div>
            <div
              className={`${styles.step} ${
                currentStep >= 3 ? styles.active : ''
              }`}
            >
              <span className={styles.stepNumber}>3</span>
              <span>決済</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        {currentStep !== 4 && (
          <>
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              {paymentError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#991b1b',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                  }}
                >
                  ⚠️ {paymentError}
                </div>
              )}

              {currentStep === 1 && (
                <>
                  {/* Shipping Information Form (for new address or non-logged-in users) */}
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>配送先情報</legend>

                    {/* Always show: Name, Email, Phone */}
                    <div className={styles.formRow}>
                      <TextInput
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="山田"
                        label="姓"
                        inputType="text"
                        required
                        error={fieldErrors.firstName}
                        containerStyle={{ marginBottom: '16px' }}
                      />
                      <TextInput
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="太郎"
                        label="名"
                        inputType="text"
                        required
                        error={fieldErrors.lastName}
                        containerStyle={{ marginBottom: '16px' }}
                      />
                    </div>

                    <TextInput
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                      label="メールアドレス"
                      inputType="text"
                      required
                      error={fieldErrors.email}
                      containerStyle={{ marginBottom: '16px' }}
                    />

                    <TextInput
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="09012345678"
                      label="電話番号"
                      inputType="number"
                      required
                      error={fieldErrors.phone}
                      containerStyle={{ marginBottom: '16px' }}
                    />

                    {/* For non-logged-in users or when no addresses available: show full address form */}
                    {(!isLoggedIn || userAddresses.length === 0) && (
                      <>
                        <div className={styles.formGroup}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <TextInput
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                                placeholder="8112108"
                                label="郵便番号"
                                inputType="number"
                                maxLength={7}
                                disabled={isSearchingAddress}
                                required
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
                                  e.currentTarget.style.backgroundColor =
                                    '#f0f0f0';
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
                                cursor: isSearchingAddress
                                  ? 'not-allowed'
                                  : 'pointer',
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
                              }}
                            >
                              {addressSearchError}
                            </div>
                          )}
                          {isSearchingAddress && (
                            <div
                              style={{
                                color: '#0066cc',
                                fontSize: '12px',
                                marginTop: '4px',
                              }}
                            >
                              住所を検索中...
                            </div>
                          )}
                        </div>

                        <div
                          style={{ marginBottom: '16px', position: 'relative' }}
                        >
                          <label
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              display: 'block',
                              marginBottom: '8px',
                            }}
                          >
                            都道府県
                            <span
                              style={{ color: '#e74c3c', marginLeft: '4px' }}
                            >
                              *
                            </span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Dropdown
                              isOpen={isPrefectureDropdownOpen}
                              onToggle={() =>
                                setIsPrefectureDropdownOpen(
                                  !isPrefectureDropdownOpen
                                )
                              }
                              onClose={() => setIsPrefectureDropdownOpen(false)}
                              buttonText={
                                prefectureOptions.find(
                                  (opt) => opt.id === formData.prefecture
                                )?.label || '選択してください'
                              }
                              containerClassName={
                                fieldErrors.prefecture
                                  ? 'prefectureDropdownError'
                                  : undefined
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
                                    e.currentTarget.style.backgroundColor =
                                      'transparent';
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
                              }}
                            >
                              {fieldErrors.prefecture}
                            </div>
                          )}
                        </div>

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
                          name="building"
                          value={formData.building}
                          onChange={handleInputChange}
                          placeholder="◇◇ビル 4階"
                          label="建物名（オプション）"
                          inputType="text"
                          containerStyle={{ marginBottom: '16px' }}
                        />
                      </>
                    )}

                    {/* For logged-in users with saved addresses: show address selection */}
                    {isLoggedIn && userAddresses.length > 0 && (
                      <div
                        style={{
                          marginTop: '24px',
                          paddingTop: '24px',
                          borderTop: '1px solid #e5e7eb',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '12px',
                          }}
                        >
                          配送先住所を選択
                        </h3>
                        <div style={{ marginBottom: '20px' }}>
                          {isLoadingAddresses ? (
                            <div style={{ textAlign: 'center', color: '#999' }}>
                              住所を読み込み中...
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                              }}
                            >
                              {userAddresses.map((address) => (
                                <label
                                  key={address.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '12px',
                                    border:
                                      selectedAddressId === address.id
                                        ? '2px solid #0066cc'
                                        : '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    backgroundColor:
                                      selectedAddressId === address.id
                                        ? '#f0f7ff'
                                        : '#fff',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="addressSelection"
                                    value={address.id}
                                    checked={selectedAddressId === address.id}
                                    onChange={(e) =>
                                      setSelectedAddressId(e.target.value)
                                    }
                                    style={{
                                      marginRight: '12px',
                                      marginTop: '2px',
                                      cursor: 'pointer',
                                    }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: '600',
                                          color: '#333',
                                        }}
                                      >
                                        〒{address.postalCode}{' '}
                                        {address.prefecture}
                                        {address.address}
                                      </div>
                                      {address.isMain && (
                                        <span
                                          style={{
                                            fontSize: '12px',
                                            backgroundColor: '#0066cc',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontWeight: '500',
                                          }}
                                        >
                                          メイン
                                        </span>
                                      )}
                                    </div>
                                    {address.option && (
                                      <div
                                        style={{
                                          fontSize: '14px',
                                          color: '#666',
                                        }}
                                      >
                                        {address.option}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Button to add a new address */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddressModalOpen(true);
                            setNewAddressError(null);
                            setNewAddressFormData({
                              postalCode: '',
                              prefecture: '',
                              address: '',
                              option: '',
                            });
                          }}
                          style={{
                            padding: '12px',
                            border: '1px solid #0066cc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            color: '#0066cc',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            width: '100%',
                            marginTop: '12px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f7ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                          }}
                        >
                          + 新しい配送先を追加する
                        </button>
                      </div>
                    )}
                  </fieldset>

                  {/* Address Modal */}
                  {isAddressModalOpen && (
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                      }}
                      onClick={() => {
                        if (!isAddingAddress) setIsAddressModalOpen(false);
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          padding: '30px',
                          maxWidth: '500px',
                          width: '90%',
                          maxHeight: '90vh',
                          overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2
                          style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '20px',
                          }}
                        >
                          新しい配送先を追加
                        </h2>

                        {newAddressError && (
                          <div
                            style={{
                              backgroundColor: '#fee',
                              color: '#c33',
                              padding: '12px',
                              borderRadius: '4px',
                              marginBottom: '16px',
                              fontSize: '14px',
                            }}
                          >
                            {newAddressError}
                          </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '6px',
                            }}
                          >
                            郵便番号
                            <span
                              style={{ color: '#e74c3c', marginLeft: '4px' }}
                            >
                              *
                            </span>
                          </label>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                            }}
                          >
                            <input
                              type="number"
                              maxLength={7}
                              value={newAddressFormData.postalCode}
                              onChange={(e) =>
                                handleNewAddressFormChange(
                                  'postalCode',
                                  e.target.value
                                )
                              }
                              placeholder="8112108"
                              disabled={isSearchingAddressInModal}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleSearchAddressInModal}
                              disabled={isSearchingAddressInModal}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: '#fff',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: isSearchingAddressInModal
                                  ? 'not-allowed'
                                  : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                opacity: isSearchingAddressInModal ? 0.6 : 1,
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSearchingAddressInModal) {
                                  e.currentTarget.style.backgroundColor =
                                    '#f0f0f0';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                              }}
                            >
                              {isSearchingAddressInModal
                                ? '検索中...'
                                : '住所検索'}
                            </button>
                          </div>
                          {addressSearchErrorInModal && (
                            <div
                              style={{
                                color: '#c33',
                                fontSize: '12px',
                                marginTop: '4px',
                              }}
                            >
                              {addressSearchErrorInModal}
                            </div>
                          )}
                        </div>

                        <div
                          style={{ marginBottom: '16px', position: 'relative' }}
                        >
                          <label
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '6px',
                              display: 'block',
                            }}
                          >
                            都道府県
                            <span
                              style={{ color: '#e74c3c', marginLeft: '4px' }}
                            >
                              *
                            </span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Dropdown
                              isOpen={isPrefectureDropdownOpenInModal}
                              onToggle={() =>
                                setIsPrefectureDropdownOpenInModal(
                                  !isPrefectureDropdownOpenInModal
                                )
                              }
                              onClose={() =>
                                setIsPrefectureDropdownOpenInModal(false)
                              }
                              buttonText={
                                prefectureOptions.find(
                                  (opt) =>
                                    opt.id === newAddressFormData.prefecture
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
                                    e.currentTarget.style.backgroundColor =
                                      'transparent';
                                  }}
                                  onClick={() => {
                                    handleNewAddressFormChange(
                                      'prefecture',
                                      option.id
                                    );
                                    setIsPrefectureDropdownOpenInModal(false);
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
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '6px',
                            }}
                          >
                            住所
                            <span
                              style={{ color: '#e74c3c', marginLeft: '4px' }}
                            >
                              *
                            </span>
                          </label>
                          <input
                            type="text"
                            value={newAddressFormData.address}
                            onChange={(e) =>
                              handleNewAddressFormChange(
                                'address',
                                e.target.value
                              )
                            }
                            placeholder="丸の内1-1-1"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '6px',
                            }}
                          >
                            建物名（オプション）
                          </label>
                          <input
                            type="text"
                            value={newAddressFormData.option}
                            onChange={(e) =>
                              handleNewAddressFormChange(
                                'option',
                                e.target.value
                              )
                            }
                            placeholder="◇◇ビル 4階"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setIsAddressModalOpen(false)}
                            disabled={isAddingAddress}
                            style={{
                              padding: '10px 20px',
                              border: '1px solid #ddd',
                              backgroundColor: '#fff',
                              borderRadius: '4px',
                              cursor: isAddingAddress
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '14px',
                              opacity: isAddingAddress ? 0.6 : 1,
                            }}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNewAddress}
                            disabled={isAddingAddress}
                            style={{
                              padding: '10px 20px',
                              border: 'none',
                              backgroundColor: '#0066cc',
                              color: '#fff',
                              borderRadius: '4px',
                              cursor: isAddingAddress
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '14px',
                              opacity: isAddingAddress ? 0.6 : 1,
                            }}
                          >
                            {isAddingAddress ? '追加中...' : '追加する'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Order Confirmation */}
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>注文内容確認</legend>

                    {/* Shipping Information Display */}
                    <div
                      style={{
                        marginBottom: '20px',
                        paddingBottom: '20px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '12px',
                        }}
                      >
                        配送先情報
                      </h3>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          lineHeight: '1.8',
                        }}
                      >
                        <p>
                          {formData.firstName} {formData.lastName}
                        </p>
                        {/* Display selected saved address for logged-in users */}
                        {isLoggedIn &&
                        selectedAddressId &&
                        userAddresses.length > 0 &&
                        !useNewAddress ? (
                          (() => {
                            const selectedAddress = userAddresses.find(
                              (addr) => addr.id === selectedAddressId
                            );
                            return selectedAddress ? (
                              <>
                                <p>〒{selectedAddress.postalCode}</p>
                                <p>
                                  {selectedAddress.prefecture}{' '}
                                  {selectedAddress.address}
                                </p>
                                {selectedAddress.option && (
                                  <p>{selectedAddress.option}</p>
                                )}
                              </>
                            ) : null;
                          })()
                        ) : (
                          <>
                            <p>〒{formData.postalCode}</p>
                            <p>
                              {formData.prefecture} {formData.address}
                            </p>
                            {formData.building && <p>{formData.building}</p>}
                          </>
                        )}
                        <p>{formData.email}</p>
                        <p>{formData.phone}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {cartItems.length > 0 && (
                      <div
                        style={{
                          marginBottom: '20px',
                          paddingBottom: '20px',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '12px',
                          }}
                        >
                          商品
                        </h3>
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '14px',
                              marginBottom: '8px',
                              color: '#6b7280',
                            }}
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>
                              ¥
                              {(
                                getPriceWithTax(item.price) * item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Price Summary */}
                    <div style={{ marginBottom: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          marginBottom: '8px',
                          color: '#6b7280',
                        }}
                      >
                        <span>小計</span>
                        <span>
                          ¥{priceInfo.subtotalWithTax.toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginBottom: '8px',
                          textAlign: 'right',
                        }}
                      >
                        （内消費税 ¥{priceInfo.tax.toLocaleString()}）
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          marginBottom: '8px',
                          color: '#6b7280',
                        }}
                      >
                        <span>送料</span>
                        <span>¥{priceInfo.shippingFee.toLocaleString()}</span>
                      </div>
                      {coupon && priceInfo.discountAmount > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                            marginBottom: '8px',
                            color: '#e74c3c',
                            fontWeight: 'bold',
                          }}
                        >
                          <span>割引（クーポン）</span>
                          <span>
                            -¥{priceInfo.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '16px',
                          fontWeight: '600',
                          paddingTop: '12px',
                          borderTop: '1px solid #e5e7eb',
                        }}
                      >
                        <span>合計</span>
                        <span>¥{priceInfo.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </fieldset>
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* Order Summary - at the top */}
                  <div className={styles.orderSummary}>
                    <h2 className={styles.summaryTitle}>注文概要</h2>

                    {/* Cart Items */}
                    {cartItems.length > 0 && (
                      <div
                        style={{
                          marginBottom: '20px',
                          paddingBottom: '20px',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '10px',
                          }}
                        >
                          商品
                        </h3>
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '14px',
                              marginBottom: '8px',
                              color: '#6b7280',
                            }}
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>
                              ¥
                              {(
                                getPriceWithTax(item.price) * item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.summaryItem}>
                      <span>小計</span>
                      <span>¥{priceInfo.subtotalWithTax.toLocaleString()}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginBottom: '8px',
                        textAlign: 'right',
                        paddingRight: '0',
                      }}
                    >
                      （内消費税 ¥{priceInfo.tax.toLocaleString()}）
                    </div>
                    <div className={styles.summaryItem}>
                      <span>送料</span>
                      <span>¥{priceInfo.shippingFee.toLocaleString()}</span>
                    </div>
                    {coupon && priceInfo.discountAmount > 0 && (
                      <div
                        className={styles.summaryItem}
                        style={{ color: '#e74c3c', fontWeight: 'bold' }}
                      >
                        <span>割引（クーポン）</span>
                        <span>
                          -¥{priceInfo.discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className={styles.summaryDivider}></div>

                    <div className={styles.summaryTotal}>
                      <span>合計</span>
                      <span>¥{priceInfo.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Information - at the bottom */}
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>決済</legend>

                    {/* Payment Method Type Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '8px 0',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="bank_transfer"
                          checked={paymentMode === 'bank_transfer'}
                          onChange={() => {
                            setPaymentMode('bank_transfer');
                            setSelectedPaymentMethodId(null);
                          }}
                          style={{ marginRight: '12px' }}
                        />
                        口座振込
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '8px 0',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="credit_card"
                          checked={paymentMode === 'credit_card'}
                          onChange={() => {
                            setPaymentMode('credit_card');
                            setSelectedPaymentMethodId(null);
                            setSavePaymentMethod(false);
                          }}
                          style={{ marginRight: '12px' }}
                        />
                        クレジットカード
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '8px 0',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="apple_pay"
                          checked={paymentMode === 'apple_pay'}
                          onChange={() => {
                            setPaymentMode('apple_pay');
                            setSelectedPaymentMethodId(null);
                          }}
                          style={{ marginRight: '12px' }}
                        />
                        Apple Pay
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '8px 0',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          value="google_pay"
                          checked={paymentMode === 'google_pay'}
                          onChange={() => {
                            setPaymentMode('google_pay');
                            setSelectedPaymentMethodId(null);
                          }}
                          style={{ marginRight: '12px' }}
                        />
                        Google Pay
                      </label>
                    </div>

                    {/* Credit Card Payment */}
                    {paymentMode === 'credit_card' && (
                      <PaymentForm
                        applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                        locationId="LP30F7K9QGGXC"
                        cardTokenizeResponseReceived={async (token: any) => {
                          if (token.status === 'OK') {
                            await handlePayment(token.token);
                          } else {
                            setPaymentError(
                              token.errors?.[0]?.message ||
                                'トークン生成中にエラーが発生しました'
                            );
                          }
                        }}
                      >
                        <div>
                          <h4 style={{ marginBottom: '15px' }}>
                            クレジットカード情報
                          </h4>

                          {/* Saved Cards Section - Only for logged in users */}
                          {isLoggedIn && (
                            <div style={{ marginBottom: '20px' }}>
                              <h5
                                style={{
                                  marginBottom: '10px',
                                  fontSize: '14px',
                                }}
                              >
                                保存済みカードから選択
                              </h5>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                }}
                              >
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="saved_card"
                                    value="sandbox_4111"
                                    checked={
                                      selectedPaymentMethodId === 'sandbox_4111'
                                    }
                                    onChange={(e) =>
                                      setSelectedPaymentMethodId(e.target.value)
                                    }
                                    style={{ marginRight: '10px' }}
                                  />
                                  <span>
                                    •••• •••• •••• 1111 (Sandbox Test Card)
                                  </span>
                                </label>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="saved_card"
                                    value="new_card"
                                    checked={
                                      selectedPaymentMethodId === 'new_card'
                                    }
                                    onChange={(e) =>
                                      setSelectedPaymentMethodId(e.target.value)
                                    }
                                    style={{ marginRight: '10px' }}
                                  />
                                  <span>新しいカードを追加</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* New Card Form - Always shown for non-logged in users, optional for logged in users */}
                          {!isLoggedIn ? (
                            // Non-logged in: Always show new card form
                            <div style={{ marginBottom: '20px' }}>
                              <h5
                                style={{
                                  marginBottom: '10px',
                                  fontSize: '14px',
                                }}
                              >
                                カード情報を入力
                              </h5>
                              <CreditCard />
                            </div>
                          ) : (
                            // Logged in: Show form only if selected
                            selectedPaymentMethodId === 'new_card' && (
                              <div style={{ marginBottom: '20px' }}>
                                <h5
                                  style={{
                                    marginBottom: '10px',
                                    fontSize: '14px',
                                  }}
                                >
                                  カード情報を入力
                                </h5>
                                <div
                                  style={{
                                    marginTop: '10px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    id="save_card"
                                    checked={savePaymentMethod}
                                    onChange={(e) =>
                                      setSavePaymentMethod(e.target.checked)
                                    }
                                    style={{ marginRight: '8px' }}
                                  />
                                  <label
                                    htmlFor="save_card"
                                    style={{
                                      fontSize: '14px',
                                      cursor: 'pointer',
                                      marginBottom: '0',
                                    }}
                                  >
                                    このカード情報を保存する
                                  </label>
                                </div>
                                <CreditCard />
                              </div>
                            )
                          )}

                          {/* Saved Card Info - Only for logged in users */}
                          {isLoggedIn &&
                            selectedPaymentMethodId === 'sandbox_4111' && (
                              <div
                                style={{
                                  padding: '15px',
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '4px',
                                  marginBottom: '20px',
                                  fontSize: '14px',
                                }}
                              >
                                <p style={{ marginBottom: '8px' }}>
                                  <strong>カード番号:</strong> •••• •••• ••••
                                  1111
                                </p>
                                <p style={{ marginBottom: '8px' }}>
                                  <strong>カード所有者:</strong> Test User
                                </p>
                                <p>
                                  <strong>有効期限:</strong> 12/25
                                </p>
                              </div>
                            )}
                        </div>
                      </PaymentForm>
                    )}

                    {/* Bank Transfer Payment */}
                    {paymentMode === 'bank_transfer' && (
                      <div
                        style={{
                          backgroundColor: '#f9fafb',
                          padding: '15px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <h4 style={{ marginBottom: '10px' }}>口座振込情報</h4>
                        <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                          <strong>銀行:</strong> 〇〇銀行
                        </p>
                        <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                          <strong>支店:</strong> 〇〇支店
                        </p>
                        <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                          <strong>口座種別:</strong> 普通
                        </p>
                        <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                          <strong>口座番号:</strong> 1234567
                        </p>
                        <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                          <strong>名義人:</strong> マークスポーツ
                        </p>
                        <p
                          style={{
                            marginTop: '15px',
                            fontSize: '12px',
                            color: '#6b7280',
                          }}
                        >
                          ご注文完了後、上記の口座にお振込みください。口座情報はメールでも送信いたします。振込確認後、商品の発送手配をいたします。
                        </p>
                      </div>
                    )}

                    {/* Apple Pay */}
                    {paymentMode === 'apple_pay' && (
                      <div>
                        <h4 style={{ marginBottom: '15px' }}>Apple Pay</h4>
                        <p
                          style={{
                            marginBottom: '15px',
                            fontSize: '14px',
                            color: '#6b7280',
                          }}
                        >
                          iPhone または iPad の Apple Pay で支払います。Safari
                          ブラウザ上でのみご利用いただけます。
                        </p>
                        <PaymentForm
                          applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                          locationId="LP30F7K9QGGXC"
                          createPaymentRequest={() => ({
                            countryCode: 'JP',
                            currencyCode: 'JPY',
                            lineItems: [
                              {
                                amount: String(priceInfo.subtotal),
                                label: '商品代金',
                                pending: false,
                              },
                              {
                                amount: String(priceInfo.shippingFee),
                                label: '送料',
                                pending: false,
                              },
                              {
                                amount: String(priceInfo.tax),
                                label: '消費税',
                                pending: false,
                              },
                            ],
                            requestShippingAddress: false,
                            requestBillingInfo: false,
                            total: {
                              amount: String(priceInfo.total),
                              label: '合計',
                            },
                          })}
                          cardTokenizeResponseReceived={async (token: any) => {
                            if (token.status === 'OK') {
                              await handlePayment(token.token);
                            } else {
                              setPaymentError(
                                token.errors?.[0]?.message ||
                                  'トークン生成中にエラーが発生しました'
                              );
                            }
                          }}
                        >
                          <ApplePay />
                        </PaymentForm>
                      </div>
                    )}

                    {/* Google Pay */}
                    {paymentMode === 'google_pay' && (
                      <div>
                        <h4 style={{ marginBottom: '15px' }}>Google Pay</h4>
                        <p
                          style={{
                            marginBottom: '15px',
                            fontSize: '14px',
                            color: '#6b7280',
                          }}
                        >
                          Android デバイスの Google Pay
                          で支払います。対応ブラウザ上でのみご利用いただけます。
                        </p>
                        <PaymentForm
                          applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                          locationId="LP30F7K9QGGXC"
                          createPaymentRequest={() => ({
                            countryCode: 'JP',
                            currencyCode: 'JPY',
                            lineItems: [
                              {
                                amount: String(priceInfo.subtotal),
                                label: '商品代金',
                                pending: false,
                              },
                              {
                                amount: String(priceInfo.shippingFee),
                                label: '送料',
                                pending: false,
                              },
                              {
                                amount: String(priceInfo.tax),
                                label: '消費税',
                                pending: false,
                              },
                            ],
                            requestShippingAddress: false,
                            requestBillingInfo: false,
                            total: {
                              amount: String(priceInfo.total),
                              label: '合計',
                            },
                          })}
                          cardTokenizeResponseReceived={async (token: any) => {
                            if (token.status === 'OK') {
                              await handlePayment(token.token);
                            } else {
                              setPaymentError(
                                token.errors?.[0]?.message ||
                                  'トークン生成中にエラーが発生しました'
                              );
                            }
                          }}
                        >
                          <GooglePay />
                        </PaymentForm>
                      </div>
                    )}

                    {/* Purchase Button - only for bank transfer */}
                    {paymentMode === 'bank_transfer' && (
                      <div style={{ marginTop: '20px' }}>
                        <button
                          type="button"
                          className={styles.nextButton}
                          onClick={() => handlePayment()}
                          disabled={isProcessing}
                          style={{
                            opacity: isProcessing ? 0.6 : 1,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            width: '100%',
                          }}
                        >
                          {isProcessing ? '処理中...' : '購入する'}
                        </button>
                      </div>
                    )}
                  </fieldset>
                </>
              )}

              {/* Buttons */}
              <div className={styles.buttonGroup}>
                {currentStep === 1 && (
                  <>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={handleNextStep}
                    >
                      注文内容確認へ進む →
                    </button>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={() => setCurrentStep(1)}
                      disabled={isProcessing}
                    >
                      ← 戻る
                    </button>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={handleConfirmStep}
                      disabled={isProcessing}
                    >
                      決済へ進む →
                    </button>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={() => setCurrentStep(2)}
                      disabled={isProcessing}
                    >
                      ← 戻る
                    </button>
                  </>
                )}
              </div>
            </form>
          </>
        )}

        {currentStep === 4 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '20px',
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '600',
                marginBottom: '10px',
                color: '#059669',
              }}
            >
              ご注文ありがとうございました
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '30px',
              }}
            >
              ご注文を受け付けました
            </p>

            {!isLoggedIn ? (
              <>
                <div
                  style={{
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '30px',
                    color: '#1e40af',
                  }}
                >
                  <p style={{ marginBottom: '10px', fontSize: '16px' }}>
                    📧 ご登録いただいたメールアドレスに
                  </p>
                  <p style={{ marginBottom: '0', fontSize: '16px' }}>
                    注文確認メールをお送りいたしました
                  </p>
                  <p
                    style={{
                      marginTop: '10px',
                      fontSize: '14px',
                      opacity: 0.9,
                    }}
                  >
                    メールをご確認ください
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: '30px',
                  }}
                >
                  <button
                    type="button"
                    className={styles.nextButton}
                    onClick={() => router.push('/orders')}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      fontSize: '16px',
                    }}
                  >
                    注文履歴を確認する →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </CheckoutLayout>
  );
}
