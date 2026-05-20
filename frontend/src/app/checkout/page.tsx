'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import '@/styles/square-payment.css';
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay,
} from 'react-square-web-payments-sdk';
import CheckoutLayout from '@/components/Layout/CheckoutLayout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePaymentMethod } from '@/context/PaymentMethodContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { getPriceWithTax } from '@/utils/price';
import {
  searchAddressByPostalCode,
  getAddresses,
  addAddress,
  AddressItem,
} from '@/api/address';
import {
  getSavedCards,
  SavedCard,
  addCard,
  submitPayment,
} from '@/api/payment';
import { saveOrder } from '@/api/orders';
import { estimateShipping } from '@/api/shipping';
import TextInput from '@/components/Input/TextInput';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import BankTransferDetails from '@/components/BankTransferDetails/BankTransferDetails';
import { CardFormComponent } from '@/components/CardFormComponent/CardFormComponent';
import { CardAddModal } from '@/components/CardAddModal/CardAddModal';
import { TAX_RATE } from '@/constants/tax';
import { convertPrefectureToJapanese } from '@/constants/prefectures';
import {
  Box,
  Stack,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Chip,
} from '@mui/material';

export default function CheckoutPage() {
  const FREE_SHIPPING_THRESHOLD = 4000;
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { items: cartItems, clear: clearCart, coupon } = useCart();
  const { paymentMethods, addPaymentMethod } = usePaymentMethod();
  const { show: showSnackbar } = useSnackbar();
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
  const [cardholderName, setCardholderName] = useState('');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isPrefectureDropdownOpen, setIsPrefectureDropdownOpen] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userAddresses, setUserAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
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
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cardsLoadError, setCardsLoadError] = useState<string | null>(null);
  const [squareCustomerId, setSquareCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    address: '',
    building: '',
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingRegionKey, setShippingRegionKey] = useState<string | null>(
    null,
  );
  const [shippingBreakdown, setShippingBreakdown] = useState({
    baseFeeApplied: 0,
    regionFee: 0,
  });

  const regionLabelMap: Record<string, string> = {
    hokkaido: '北海道',
    tohoku: '東北',
    chubuKanto: '中部・関東',
    chugokuKansai: '中国・関西',
    kyushu: '九州',
    okinawa: '沖縄',
  };

  const SHIPPING_FEE_NORMAL = 500; // 通常配送料金
  const scrollRef = useRef<HTMLDivElement>(null);

  // ステップ変更時にトップへスムーズスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // 支払い方法制限の検出
  const paymentRestrictionInfo = useMemo(() => {
    const restrictedItems = cartItems.filter((item) => item.paymentMethodRestriction);
    const freeItems = cartItems.filter((item) => !item.paymentMethodRestriction);
    const uniqueMethods = [...new Set(restrictedItems.map((i) => i.paymentMethodRestriction as string))];
    const hasConflict = uniqueMethods.length > 1;
    const restrictedMethod = !hasConflict && uniqueMethods.length === 1 ? uniqueMethods[0] : null;
    const hasSplit = !hasConflict && restrictedItems.length > 0 && freeItems.length > 0;
    const onlyRestricted = !hasConflict && restrictedItems.length > 0 && freeItems.length === 0;
    return { restrictedItems, freeItems, restrictedMethod, hasSplit, onlyRestricted, hasConflict, conflictMethods: uniqueMethods };
  }, [cartItems]);

  const restrictionLabel = (method: string | null | undefined) => {
    switch (method) {
      case 'bank_transfer': return '口座振込';
      case 'credit_card': return 'クレジットカード';
      case 'apple_pay': return 'Apple Pay';
      case 'google_pay': return 'Google Pay';
      default: return method || '';
    }
  };

  // 金額計算のメモ化
  const priceInfo = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = shippingCost;
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
          (couponTargetAmount * coupon.discount_value) / 100,
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
  }, [cartItems, coupon, shippingCost]);

  useEffect(() => {
    const calculateShippingCost = async () => {
      if (cartItems.length === 0) {
        setShippingCost(0);
        setShippingRegionKey(null);
        setShippingBreakdown({ baseFeeApplied: 0, regionFee: 0 });
        return;
      }

      try {
        setIsCalculatingShipping(true);
        const selectedAddress = userAddresses.find(
          (addr) => addr.id === selectedAddressId,
        );
        const prefectureSource =
          isLoggedIn && !useNewAddress
            ? selectedAddress?.prefecture || formData.prefecture
            : formData.prefecture;
        const prefecture = convertPrefectureToJapanese(prefectureSource || '');

        const response = await estimateShipping({
          items: cartItems.map((item) => ({
            productId: String(item.id),
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          shippingAddress: {
            prefecture,
            administrativeDistrictLevel1: prefecture,
          },
        });

        if (response.success && response.data) {
          setShippingCost(response.data.shippingCost ?? SHIPPING_FEE_NORMAL);
          setShippingRegionKey(response.data.regionKey || null);
          setShippingBreakdown({
            baseFeeApplied: response.data.breakdown?.baseFeeApplied ?? 0,
            regionFee: response.data.breakdown?.regionFee ?? 0,
          });
        } else {
          setShippingCost(SHIPPING_FEE_NORMAL);
          setShippingRegionKey(null);
          setShippingBreakdown({
            baseFeeApplied: SHIPPING_FEE_NORMAL,
            regionFee: 0,
          });
        }
      } catch (shippingError) {
        console.error('Failed to estimate shipping:', shippingError);
        setShippingCost(SHIPPING_FEE_NORMAL);
        setShippingRegionKey(null);
        setShippingBreakdown({
          baseFeeApplied: SHIPPING_FEE_NORMAL,
          regionFee: 0,
        });
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShippingCost();
  }, [
    cartItems,
    formData.prefecture,
    isLoggedIn,
    useNewAddress,
    selectedAddressId,
    userAddresses,
  ]);

  // ログイン状態で情報を自動入力
  useEffect(() => {
    if (isLoggedIn && user) {
      // 統一された名前フィールドを使用
      const name = user.shippingAddress?.name || user.name || '';

      setFormData((prev) => ({
        ...prev,
        name: name,
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

  // 支払い方法制限がある場合、paymentMode を自動設定（split・onlyRestricted 両方）
  useEffect(() => {
    if ((paymentRestrictionInfo.onlyRestricted || paymentRestrictionInfo.hasSplit) && paymentRestrictionInfo.restrictedMethod) {
      setPaymentMode(paymentRestrictionInfo.restrictedMethod as any);
    }
  }, [paymentRestrictionInfo.onlyRestricted, paymentRestrictionInfo.hasSplit, paymentRestrictionInfo.restrictedMethod]);

  // ログイン状態に応じてカード選択を初期化
  useEffect(() => {
    if (isLoggedIn) {
      setSelectedPaymentMethodId('sandbox_4111');
    } else {
      setSelectedPaymentMethodId('new_card');
    }
  }, [isLoggedIn]);

  // クレジットカード選択時にAPIで保存済みカードを取得
  useEffect(() => {
    const loadSavedCards = async () => {
      if (paymentMode === 'credit_card' && isLoggedIn) {
        setIsLoadingCards(true);
        setCardsLoadError(null);
        try {
          const response = await getSavedCards();
          if (response.success && response.data) {
            setSavedCards(response.data);
            // デフォルトカード（isDefault: true）を探す
            const defaultCard = response.data.find((card) => card.isDefault);
            if (defaultCard) {
              setSelectedPaymentMethodId(defaultCard.id);
            } else if (response.data.length > 0) {
              // デフォルトカードがない場合は最初のカードを選択
              setSelectedPaymentMethodId(response.data[0].id);
            }
          }
        } catch (error) {
          console.error('Failed to load saved cards:', error);
          setCardsLoadError('保存済みカードの読み込みに失敗しました');
        } finally {
          setIsLoadingCards(false);
        }
      }
    };

    loadSavedCards();
  }, [paymentMode, isLoggedIn]);

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
    null,
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
          (opt) => opt.label === result.data!.prefecture,
        )?.id;

        if (prefectureId) {
          handleNewAddressFormChange('prefecture', prefectureId);
        }
        handleNewAddressFormChange('address', result.data.address);
      } else {
        setAddressSearchErrorInModal(
          result.message || '指定の郵便番号が見つかりません',
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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
    if (paymentRestrictionInfo.hasConflict) {
      setPaymentError('決済方法が競合しています。カートに戻り、競合する商品を削除してください。');
      return;
    }
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
    if (!formData.name) errors.name = 'お名前を入力してください';
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
      let orderStatus: 'unpaid' | 'awaiting_shipment' | null = null;

      // 制限付き商品がある場合はその支払い方法をカート全体に適用
      const effectivePaymentMode = (paymentRestrictionInfo.hasSplit || paymentRestrictionInfo.onlyRestricted)
        ? paymentRestrictionInfo.restrictedMethod as typeof paymentMode
        : paymentMode;

      console.log('handlePayment called with sourceId:', sourceId, 'effectivePaymentMode:', effectivePaymentMode);

      // 支払い方法ごとの処理
      switch (effectivePaymentMode) {
        case 'credit_card':
          if (!sourceId) {
            setPaymentError('カード情報を入力してください');
            setIsProcessing(false);
            return;
          }
          paymentSourceId = sourceId;
          console.log('Credit card sourceId:', paymentSourceId);
          orderStatus = 'awaiting_shipment';
          break;

        case 'bank_transfer':
          // 口座振込は即座に完了
          paymentSourceId = `bank_${Date.now()}`;
          orderStatus = 'unpaid';
          break;

        case 'apple_pay':
          // Apple Pay のトークン取得処理
          paymentSourceId = sourceId || `apple_pay_${Date.now()}`;
          console.log('Apple Pay sourceId:', paymentSourceId);
          orderStatus = 'awaiting_shipment';
          break;

        case 'google_pay':
          // Google Pay のトークン取得処理
          paymentSourceId = sourceId || `google_pay_${Date.now()}`;
          console.log('Google Pay sourceId:', paymentSourceId);
          orderStatus = 'awaiting_shipment';
          break;

        default:
          setPaymentError('支払い方法を選択してください');
          setIsProcessing(false);
          return;
      }

      // Get auth token from localStorage
      let authToken: string | undefined;
      if (typeof window !== 'undefined') {
        const authTokensStr = localStorage.getItem('authTokens');
        if (authTokensStr) {
          try {
            const authTokens = JSON.parse(authTokensStr);
            authToken = authTokens.accessToken;
          } catch (e) {
            console.warn('Failed to parse authTokens from localStorage');
          }
        }
      }

      console.log('Submitting payment with:', {
        sourceId: paymentSourceId,
        amount: priceInfo.total,
        currency: 'JPY',
        orderId: `ORDER_${Date.now()}`,
      });

      const result = await submitPayment(
        {
          sourceId: paymentSourceId,
          amount: priceInfo.total,
          currency: 'JPY',
          orderId: `ORDER_${Date.now()}`,
        },
        authToken,
      );

      console.log('Payment result:', result);

      if (result && result.id) {
        // ⭐ Store customer_id for card modal
        if (result.customer_id) {
          setSquareCustomerId(result.customer_id);
          console.log('[CHECKOUT] Customer ID stored:', result.customer_id);
        }

        // ⭐ Save order to database
        try {
          console.log('Saving order...');

          // Build order items from cart (with tax included)
          const orderItems = cartItems.map((item) => {
            const rawItemId = String(item.id || '');
            const idParts = rawItemId.split('|');
            const parsedProductId = idParts[0] || item.productId;
            const parsedSize = idParts.length > 1 ? idParts[1] : '';
            const parsedColor = idParts.length > 2 ? idParts[2] : '';
            const finalSize = item.size || parsedSize;
            const finalColor = item.color || parsedColor;

            // 商品の税抜き価格
            const priceExcludingTax = item.price;
            // 商品の税額（1商品あたり）
            const taxPerItem = Math.floor(priceExcludingTax * TAX_RATE);
            // 商品の税込み価格（1商品あたり）
            const priceIncludingTax = priceExcludingTax + taxPerItem;

            return {
              productId: parsedProductId,
              productName: item.name,
              quantity: item.quantity,
              amount: priceIncludingTax, // ⭐ 税込み価格を格納
              totalAmount: priceIncludingTax * item.quantity, // ⭐ 税込み合計を格納
              ...(finalSize ? { size: finalSize } : {}),
              ...(finalColor ? { color: finalColor } : {}),
              ...(item.selectedOptionChoiceName ? { selectedOptionChoiceName: item.selectedOptionChoiceName } : {}),
            };
          });

          // Prepare payment details from selected method
          const paymentDetails: Record<string, any> = {
            paymentMethod: effectivePaymentMode,
          };

          if (
            effectivePaymentMode === 'credit_card' &&
            selectedPaymentMethodId &&
            selectedPaymentMethodId !== 'new_card'
          ) {
            // Get selected card from saved cards
            const selectedCardData = savedCards.find(
              (card) => card.id === selectedPaymentMethodId,
            );
            if (selectedCardData) {
              paymentDetails.paymentBrand = selectedCardData.cardType;
              paymentDetails.last4 = selectedCardData.lastFourDigits;
              paymentDetails.expMonth = selectedCardData.expiryMonth;
              paymentDetails.expYear = selectedCardData.expiryYear;
            }
          } else if (effectivePaymentMode === 'credit_card' && result.card_details) {
            // New card: get card info from payment result
            paymentDetails.paymentBrand = result.card_details.card_brand;
            paymentDetails.last4 = result.card_details.last_4;
            paymentDetails.expMonth = result.card_details.exp_month;
            paymentDetails.expYear = result.card_details.exp_year;
          }

          // Save order
          // Get selected address data
          const addressData = userAddresses.find(
            (addr) => addr.id === selectedAddressId,
          );

          const normalizedPrefecture = convertPrefectureToJapanese(
            addressData?.prefecture || formData.prefecture,
          );

          const orderSaveResult = await saveOrder({
            orderId: result.id,
            orderNumber: String(Date.now()),
            totalAmount: priceInfo.total,
            tax: priceInfo.tax,
            taxRate: TAX_RATE,
            shippingCost: priceInfo.shippingFee,
            discount: priceInfo.discountAmount,
            couponCode: coupon?.code,
            couponDiscount: priceInfo.discountAmount,
            shippingAddress: addressData
              ? {
                  ...addressData,
                  email: formData.email,
                  phone: formData.phone,
                  name: formData.name,
                  prefecture: normalizedPrefecture,
                }
              : {
                  givenName: formData.name.split(' ')[0] || '',
                  familyName: formData.name.split(' ')[1] || '',
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  addressLine1: formData.address,
                  addressLine2: formData.building,
                  administrativeDistrictLevel1: normalizedPrefecture,
                  postalCode: formData.postalCode,
                  country: 'JP',
                },
            billingAddress: {
              givenName: formData.name.split(' ')[0] || '',
              familyName: formData.name.split(' ')[1] || '',
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              addressLine1: formData.address,
              addressLine2: formData.building,
              administrativeDistrictLevel1: normalizedPrefecture,
              postalCode: formData.postalCode,
              country: 'JP',
            },
            squareTransactionId: result.id,
            items: orderItems,
            paymentMethod: effectivePaymentMode || 'credit_card',
            paymentBrand: paymentDetails.paymentBrand,
            last4: paymentDetails.last4,
            expMonth: paymentDetails.expMonth,
            expYear: paymentDetails.expYear,
            status: orderStatus, // Set order status after paymentMethod
            userEmail: formData.email,
            userName: formData.name,
          });

          console.log('Order saved:', orderSaveResult);

          // ⭐ No card saving here - card saving is done separately via Add Card Modal
        } catch (orderError) {
          console.error('Failed to save order:', orderError);
          // Order save failure should not block checkout flow
          showSnackbar('注文情報の保存に失敗しました', 'warning');
        }

        // ⭐ Clear cart after successful purchase
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
          : '決済処理中にエラーが発生しました',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout>
      <div ref={scrollRef} />
      {/* Navigation Buttons */}
      <Stack direction="row" spacing={1.5} sx={{ pb: 2 }}>
        <Button variant="outlined" onClick={() => router.push('/')}>
          ← トップに戻る
        </Button>
        {currentStep !== 4 && (
          <Button variant="outlined" onClick={() => router.push('/cart')}>
            ← カートに戻る
          </Button>
        )}
      </Stack>

      {currentStep !== 4 && (
        <Box sx={{ pb: 2 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1.5}>
              <Typography variant="h4" fontWeight={700}>
                注文手続き
              </Typography>
              <Typography color="text.secondary">
                買い物を完成させましょう
              </Typography>
              <Stepper
                activeStep={Math.max(currentStep - 1, 0)}
                alternativeLabel
              >
                {['配送情報入力', '注文内容確認', '決済'].map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Stack>
          </Paper>
        </Box>
      )}

      <Box sx={{ pb: 6 }}>
        {currentStep !== 4 && (
          <>
            <Box
              component="form"
              onSubmit={(e) => e.preventDefault()}
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              noValidate
            >
              {paymentError && (
                <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
                  {paymentError}
                </Alert>
              )}

              {priceInfo.subtotalWithTax >= FREE_SHIPPING_THRESHOLD ? (
                <Alert severity="success">
                  4,000円以上のため基本送料無料です（地域別配送料は別途かかります）。
                </Alert>
              ) : (
                <Alert severity="info">
                  あと¥
                  {(
                    FREE_SHIPPING_THRESHOLD - priceInfo.subtotalWithTax
                  ).toLocaleString()}
                  で基本送料無料です（地域別配送料は別途かかります）。
                </Alert>
              )}

              {currentStep === 1 && (
                <>
                  {/* Shipping Information Form (for new address or non-logged-in users) */}
                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      配送先情報
                    </Typography>

                    {/* Always show: Name, Email, Phone */}
                    <TextInput
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="例：山田 太郎"
                      label="お名前"
                      inputType="text"
                      required
                      error={fieldErrors.name}
                      containerStyle={{ marginBottom: '16px' }}
                    />

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
                        <Box sx={{ mb: 2 }}>
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
                        </Box>

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
                                  !isPrefectureDropdownOpen,
                                )
                              }
                              onClose={() => setIsPrefectureDropdownOpen(false)}
                              buttonText={
                                prefectureOptions.find(
                                  (opt) => opt.id === formData.prefecture,
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
                        <Box sx={{ mb: 2.5 }}>
                          {isLoadingAddresses ? (
                            <Typography
                              color="text.secondary"
                              textAlign="center"
                            >
                              住所を読み込み中...
                            </Typography>
                          ) : (
                            <RadioGroup
                              value={selectedAddressId || ''}
                              onChange={(e) =>
                                setSelectedAddressId(e.target.value)
                              }
                            >
                              <Stack spacing={1.5}>
                                {userAddresses.map((address) => (
                                  <FormControlLabel
                                    key={address.id}
                                    value={address.id}
                                    control={<Radio />}
                                    sx={{
                                      border:
                                        selectedAddressId === address.id
                                          ? '2px solid'
                                          : '1px solid',
                                      borderColor:
                                        selectedAddressId === address.id
                                          ? 'primary.main'
                                          : 'divider',
                                      bgcolor:
                                        selectedAddressId === address.id
                                          ? 'action.hover'
                                          : 'background.paper',
                                      borderRadius: 1,
                                      p: 1.5,
                                      m: 0,
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                      width: '100%',
                                    }}
                                    label={
                                      <Box flex={1}>
                                        <Stack spacing={0.5}>
                                          <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                          >
                                            <Typography fontWeight={600}>
                                              〒{address.postalCode}{' '}
                                              {address.prefecture}
                                              {address.address}
                                            </Typography>
                                            {address.isMain && (
                                              <Chip
                                                label="メイン"
                                                size="small"
                                                color="primary"
                                                variant="filled"
                                              />
                                            )}
                                          </Box>
                                          {address.option && (
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              {address.option}
                                            </Typography>
                                          )}
                                        </Stack>
                                      </Box>
                                    }
                                  />
                                ))}
                              </Stack>
                            </RadioGroup>
                          )}
                        </Box>

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
                  </Paper>

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
                              alignItems: 'flex-start',
                              flexWrap: 'nowrap',
                            }}
                          >
                            <input
                              type="number"
                              maxLength={7}
                              value={newAddressFormData.postalCode}
                              onChange={(e) =>
                                handleNewAddressFormChange(
                                  'postalCode',
                                  e.target.value,
                                )
                              }
                              placeholder="8112108"
                              disabled={isSearchingAddressInModal}
                              style={{
                                flex: '1 1 auto',
                                minWidth: '0',
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
                                flexShrink: 0,
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
                                  !isPrefectureDropdownOpenInModal,
                                )
                              }
                              onClose={() =>
                                setIsPrefectureDropdownOpenInModal(false)
                              }
                              buttonText={
                                prefectureOptions.find(
                                  (opt) =>
                                    opt.id === newAddressFormData.prefecture,
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
                                      option.id,
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
                                e.target.value,
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
                                e.target.value,
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
                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      注文内容確認
                    </Typography>

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
                        <p>{formData.name}</p>
                        {/* Display selected saved address for logged-in users */}
                        {isLoggedIn &&
                        selectedAddressId &&
                        userAddresses.length > 0 &&
                        !useNewAddress ? (
                          (() => {
                            const selectedAddress = userAddresses.find(
                              (addr) => addr.id === selectedAddressId,
                            );
                            return selectedAddress ? (
                              <>
                                <p>〒{selectedAddress.postalCode}</p>
                                <p>
                                  {convertPrefectureToJapanese(
                                    selectedAddress.prefecture,
                                  )}{' '}
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
                              {convertPrefectureToJapanese(formData.prefecture)}{' '}
                              {formData.address}
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
                            <div>
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              {(item.size || item.color) && (
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    display: 'flex',
                                    gap: 0.75,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {item.size && (
                                    <Chip
                                      label={`サイズ: ${item.size}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {item.color && (
                                    <Chip
                                      label={`カラー: ${item.color}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {item.selectedOptionChoiceName && item.selectedOptionChoiceName.split(' / ').map((name: string, i: number) => (
                                    <Chip
                                      key={i}
                                      label={name}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                              )}
                            </div>
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
                        <span>送料（基本）</span>
                        <span>
                          {isCalculatingShipping
                            ? '計算中...'
                            : `¥${shippingBreakdown.baseFeeApplied.toLocaleString()}`}
                        </span>
                      </div>
                      {!isCalculatingShipping &&
                        shippingBreakdown.regionFee > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '14px',
                              marginBottom: '8px',
                              color: '#6b7280',
                            }}
                          >
                            <span>
                              地域追加送料
                              {shippingRegionKey
                                ? `（${regionLabelMap[shippingRegionKey] || shippingRegionKey}）`
                                : ''}
                            </span>
                            <span>
                              ¥{shippingBreakdown.regionFee.toLocaleString()}
                            </span>
                          </div>
                        )}
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
                  </Paper>
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* Order Summary - at the top */}
                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      注文概要
                    </Typography>

                    {cartItems.length > 0 && (
                      <Box
                        sx={{
                          mb: 2,
                          pb: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{ mb: 1 }}
                        >
                          商品
                        </Typography>
                        <Stack spacing={0.75}>
                          {cartItems.map((item) => (
                            <Stack
                              key={item.id}
                              direction="row"
                              justifyContent="space-between"
                              spacing={2}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.name} × {item.quantity}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                ¥
                                {(
                                  getPriceWithTax(item.price) * item.quantity
                                ).toLocaleString()}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">小計</Typography>
                        <Typography variant="body2">
                          ¥{priceInfo.subtotalWithTax.toLocaleString()}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="right"
                      >
                        （内消費税 ¥{priceInfo.tax.toLocaleString()}）
                      </Typography>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">送料（基本）</Typography>
                        <Typography variant="body2">
                          {isCalculatingShipping
                            ? '計算中...'
                            : `¥${shippingBreakdown.baseFeeApplied.toLocaleString()}`}
                        </Typography>
                      </Stack>
                      {!isCalculatingShipping &&
                        shippingBreakdown.regionFee > 0 && (
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">
                              地域追加送料
                              {shippingRegionKey
                                ? `（${regionLabelMap[shippingRegionKey] || shippingRegionKey}）`
                                : ''}
                            </Typography>
                            <Typography variant="body2">
                              ¥{shippingBreakdown.regionFee.toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                      {coupon && priceInfo.discountAmount > 0 && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography
                            variant="body2"
                            color="error.main"
                            fontWeight={700}
                          >
                            割引（クーポン）
                          </Typography>
                          <Typography
                            variant="body2"
                            color="error.main"
                            fontWeight={700}
                          >
                            -¥{priceInfo.discountAmount.toLocaleString()}
                          </Typography>
                        </Stack>
                      )}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight={700}>
                          合計
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                          ¥{priceInfo.total.toLocaleString()}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* Payment Information - at the bottom */}
                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      決済
                    </Typography>

                    {/* Payment Method Type Selection */}
                    {paymentRestrictionInfo.hasConflict ? (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="error" sx={{ mb: 1 }}>
                          <Typography fontWeight={700} gutterBottom>
                            決済方法が競合しています
                          </Typography>
                          <Typography variant="body2">
                            カート内に決済方法の異なる商品が混在しているため、購入を完了できません。
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            競合: {paymentRestrictionInfo.conflictMethods.map(restrictionLabel).join('のみ / ')}のみ
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            カートに戻り、いずれかの商品を削除してください。
                          </Typography>
                        </Alert>
                      </Box>
                    ) : paymentRestrictionInfo.hasSplit ? (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="warning" sx={{ mb: 1 }}>
                          カートに<strong>支払い方法が制限された商品</strong>（{restrictionLabel(paymentRestrictionInfo.restrictedMethod)}のみ）が含まれているため、
                          カート全体を<strong>{restrictionLabel(paymentRestrictionInfo.restrictedMethod)}</strong>でお支払いいただきます。
                        </Alert>
                        <Chip label={restrictionLabel(paymentRestrictionInfo.restrictedMethod)} color="warning" />
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          対象商品: {paymentRestrictionInfo.restrictedItems.map((i) => i.name).join('、')}
                        </Typography>
                      </Box>
                    ) : paymentRestrictionInfo.onlyRestricted ? (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                          カート内の商品は<strong>{restrictionLabel(paymentRestrictionInfo.restrictedMethod)}</strong>でのお支払いのみ対応しています。
                        </Alert>
                        <Chip label={restrictionLabel(paymentRestrictionInfo.restrictedMethod)} color="warning" />
                      </Box>
                    ) : (
                    <Box sx={{ mb: 2 }}>
                      <RadioGroup
                        value={paymentMode ?? ''}
                        onChange={(event) => {
                          const value = event.target.value as
                            | 'credit_card'
                            | 'bank_transfer'
                            | 'apple_pay'
                            | 'google_pay';
                          setPaymentMode(value);
                          setSelectedPaymentMethodId(null);
                          setSavePaymentMethod(false);
                        }}
                      >
                        <FormControlLabel
                          value="bank_transfer"
                          control={<Radio />}
                          label="口座振込"
                        />
                        <FormControlLabel
                          value="credit_card"
                          control={<Radio />}
                          label="クレジットカード"
                        />
                        <FormControlLabel
                          value="apple_pay"
                          control={<Radio />}
                          label="Apple Pay"
                        />
                        <FormControlLabel
                          value="google_pay"
                          control={<Radio />}
                          label="Google Pay"
                        />
                      </RadioGroup>
                    </Box>
                    )}

                    {/* Credit Card Payment */}
                    {paymentMode === 'credit_card' && (
                      <PaymentForm
                        applicationId={
                          process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''
                        }
                        locationId={
                          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
                        }
                        cardTokenizeResponseReceived={async (token: any) => {
                          console.log(
                            '[DEBUG] Full token object:',
                            JSON.stringify(token, null, 2),
                          );
                          console.log('[DEBUG] token.token:', token.token);
                          console.log(
                            '[DEBUG] token.token type:',
                            typeof token.token,
                          );
                          console.log('[DEBUG] token.status:', token.status);

                          // ⭐ token の全キーを確認
                          console.log(
                            '[DEBUG] All token keys:',
                            Object.keys(token),
                          );

                          // token.token が本当に nonce か確認
                          if (token.token) {
                            console.log(
                              '[DEBUG] token.token length:',
                              token.token.length,
                            );
                            console.log(
                              '[DEBUG] token.token starts with cnon:',
                              token.token.toString().startsWith('cnon'),
                            );
                          }

                          if (token.status === 'OK') {
                            // ⭐ 重要: sourceId のみを抽出
                            const sourceId = token.token;
                            console.log(
                              '[DEBUG] Extracted sourceId:',
                              sourceId,
                            );

                            if (
                              !sourceId ||
                              !sourceId.toString().startsWith('cnon')
                            ) {
                              console.error(
                                '[ERROR] Invalid sourceId format:',
                                sourceId,
                              );
                              console.error(
                                '[ERROR] sourceId is:',
                                typeof sourceId,
                                sourceId,
                              );
                              setPaymentError('Invalid card token format');
                              return;
                            }

                            await handlePayment(sourceId);
                          } else {
                            console.error('Token Error:', token.errors);
                            setPaymentError(
                              token.errors?.[0]?.message ||
                                'トークン生成中にエラーが発生しました',
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
                              {/* Loading State */}
                              {isLoadingCards && (
                                <div
                                  style={{ padding: '10px', color: '#6b7280' }}
                                >
                                  カードを読み込み中...
                                </div>
                              )}

                              {/* Error State */}
                              {cardsLoadError && (
                                <div
                                  style={{
                                    padding: '10px',
                                    color: '#dc2626',
                                    fontSize: '14px',
                                  }}
                                >
                                  {cardsLoadError}
                                </div>
                              )}

                              {/* Saved Cards List */}
                              {!isLoadingCards && savedCards.length > 0 && (
                                <RadioGroup
                                  value={selectedPaymentMethodId || ''}
                                  onChange={(e) =>
                                    setSelectedPaymentMethodId(e.target.value)
                                  }
                                  sx={{ mb: 1.5 }}
                                >
                                  <Stack spacing={1}>
                                    {savedCards.map((card) => (
                                      <FormControlLabel
                                        key={card.id}
                                        value={card.id}
                                        control={<Radio />}
                                        sx={{
                                          border:
                                            selectedPaymentMethodId === card.id
                                              ? '1px solid'
                                              : '1px solid',
                                          borderColor:
                                            selectedPaymentMethodId === card.id
                                              ? 'primary.main'
                                              : 'divider',
                                          bgcolor:
                                            selectedPaymentMethodId === card.id
                                              ? 'action.hover'
                                              : 'transparent',
                                          borderRadius: 1,
                                          p: 1,
                                          m: 0,
                                        }}
                                        label={
                                          <Stack spacing={0.5} ml={1} flex={1}>
                                            <Typography>
                                              •••• •••• ••••{' '}
                                              {card.lastFourDigits} (
                                              {card.cardType})
                                            </Typography>
                                            <Box
                                              display="flex"
                                              alignItems="center"
                                              gap={1}
                                            >
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                有効期限:{' '}
                                                {String(
                                                  card.expiryMonth,
                                                ).padStart(2, '0')}
                                                /
                                                {String(card.expiryYear).slice(
                                                  -2,
                                                )}
                                              </Typography>
                                              {card.isDefault && (
                                                <Chip
                                                  label="メインカード"
                                                  size="small"
                                                  color="info"
                                                  variant="outlined"
                                                />
                                              )}
                                            </Box>
                                          </Stack>
                                        }
                                      />
                                    ))}
                                  </Stack>
                                </RadioGroup>
                              )}

                              {/* "New Card" Option */}
                              <FormControlLabel
                                control={<Radio />}
                                value="new_card"
                                checked={selectedPaymentMethodId === 'new_card'}
                                onChange={() =>
                                  setSelectedPaymentMethodId('new_card')
                                }
                                sx={{
                                  border:
                                    selectedPaymentMethodId === 'new_card'
                                      ? '1px solid'
                                      : '1px solid',
                                  borderColor:
                                    selectedPaymentMethodId === 'new_card'
                                      ? 'primary.main'
                                      : 'divider',
                                  bgcolor:
                                    selectedPaymentMethodId === 'new_card'
                                      ? 'action.hover'
                                      : 'transparent',
                                  borderRadius: 1,
                                  p: 1,
                                  m: 0,
                                  mb: 1,
                                }}
                                label="新しいカードを追加"
                              />

                              {/* "One-time Payment" Option (No Save) */}
                              <FormControlLabel
                                control={<Radio />}
                                value="one_time"
                                checked={selectedPaymentMethodId === 'one_time'}
                                onChange={() =>
                                  setSelectedPaymentMethodId('one_time')
                                }
                                sx={{
                                  border:
                                    selectedPaymentMethodId === 'one_time'
                                      ? '1px solid'
                                      : '1px solid',
                                  borderColor:
                                    selectedPaymentMethodId === 'one_time'
                                      ? 'primary.main'
                                      : 'divider',
                                  bgcolor:
                                    selectedPaymentMethodId === 'one_time'
                                      ? 'action.hover'
                                      : 'transparent',
                                  borderRadius: 1,
                                  p: 1,
                                  m: 0,
                                }}
                                label="別のカードで支払い"
                              />
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
                              {/* Card Holder Name for Guest */}
                              <div
                                style={{
                                  marginBottom: '15px',
                                }}
                              >
                                <label
                                  htmlFor="cardholderNameGuest"
                                  style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    marginBottom: '5px',
                                    fontWeight: '500',
                                  }}
                                >
                                  カード所有者名
                                </label>
                                <input
                                  id="cardholderNameGuest"
                                  type="text"
                                  value={cardholderName}
                                  onChange={(e) =>
                                    setCardholderName(e.target.value)
                                  }
                                  placeholder="例：TARO YAMADA"
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <CreditCard />
                            </div>
                          ) : // Logged in: Show button for new_card or form for one_time
                          selectedPaymentMethodId === 'new_card' ? (
                            <div style={{ marginBottom: '20px' }}>
                              <button
                                onClick={() => setIsAddCardModalOpen(true)}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  backgroundColor: '#0284c7',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                }}
                              >
                                新しいカードを登録
                              </button>
                            </div>
                          ) : selectedPaymentMethodId === 'one_time' ? (
                            <div style={{ marginBottom: '20px' }}>
                              <h5
                                style={{
                                  marginBottom: '10px',
                                  fontSize: '14px',
                                }}
                              >
                                カード情報を入力
                              </h5>
                              {/* Card Holder Name */}
                              <div
                                style={{
                                  marginBottom: '15px',
                                }}
                              >
                                <label
                                  htmlFor="cardholderName"
                                  style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    marginBottom: '5px',
                                    fontWeight: '500',
                                  }}
                                >
                                  カード所有者名
                                </label>
                                <input
                                  id="cardholderName"
                                  type="text"
                                  value={cardholderName}
                                  onChange={(e) =>
                                    setCardholderName(e.target.value)
                                  }
                                  placeholder="例：TARO YAMADA"
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <CreditCard />
                            </div>
                          ) : null}

                          {/* Saved Card Info - Only for logged in users */}
                          {isLoggedIn &&
                            selectedPaymentMethodId &&
                            selectedPaymentMethodId !== 'new_card' &&
                            selectedPaymentMethodId !== 'one_time' &&
                            savedCards.find(
                              (card) => card.id === selectedPaymentMethodId,
                            ) &&
                            (() => {
                              const selectedCard = savedCards.find(
                                (card) => card.id === selectedPaymentMethodId,
                              );
                              if (!selectedCard) return null;

                              return (
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
                                    <strong>カード番号:</strong> •••• •••• ••••{' '}
                                    {selectedCard.lastFourDigits}
                                  </p>
                                  <p style={{ marginBottom: '8px' }}>
                                    <strong>カードタイプ:</strong>{' '}
                                    {selectedCard.cardType}
                                  </p>
                                  <p>
                                    <strong>有効期限:</strong>{' '}
                                    {String(selectedCard.expiryMonth).padStart(
                                      2,
                                      '0',
                                    )}
                                    /{String(selectedCard.expiryYear).slice(-2)}
                                  </p>
                                  {selectedCard.isDefault && (
                                    <p
                                      style={{
                                        marginTop: '8px',
                                        color: '#0284c7',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      ★ メインカード
                                    </p>
                                  )}
                                  {/* Payment Button for Saved Card */}
                                  <button
                                    onClick={() =>
                                      handlePayment(selectedCard.id)
                                    }
                                    disabled={isProcessing}
                                    style={{
                                      marginTop: '15px',
                                      width: '100%',
                                      padding: '12px',
                                      backgroundColor: isProcessing
                                        ? '#9ca3af'
                                        : '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: isProcessing
                                        ? 'not-allowed'
                                        : 'pointer',
                                      fontSize: '16px',
                                      fontWeight: '600',
                                    }}
                                  >
                                    {isProcessing ? '処理中...' : '購入する'}
                                  </button>
                                </div>
                              );
                            })()}
                        </div>
                      </PaymentForm>
                    )}

                    {/* Bank Transfer Payment */}
                    {paymentMode === 'bank_transfer' && <BankTransferDetails />}

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
                          applicationId={
                            process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''
                          }
                          locationId={
                            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
                          }
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
                            console.log('Apple Pay Token Response:', token);
                            console.log('Apple Pay Token Value:', token.token);
                            if (token.status === 'OK') {
                              await handlePayment(token.token);
                            } else {
                              console.error(
                                'Apple Pay Token Error:',
                                token.errors,
                              );
                              setPaymentError(
                                token.errors?.[0]?.message ||
                                  'トークン生成中にエラーが発生しました',
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
                          applicationId={
                            process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ''
                          }
                          locationId={
                            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
                          }
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
                            console.log('Google Pay Token Response:', token);
                            console.log('Google Pay Token Value:', token.token);
                            if (token.status === 'OK') {
                              await handlePayment(token.token);
                            } else {
                              console.error(
                                'Google Pay Token Error:',
                                token.errors,
                              );
                              setPaymentError(
                                token.errors?.[0]?.message ||
                                  'トークン生成中にエラーが発生しました',
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
                      <Box sx={{ mt: 2 }}>
                        <Button
                          type="button"
                          variant="contained"
                          onClick={() => handlePayment()}
                          disabled={isProcessing}
                          fullWidth
                        >
                          {isProcessing ? '処理中...' : '購入する'}
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </>
              )}

              {/* Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
              >
                {currentStep === 1 && (
                  <Button
                    variant="contained"
                    onClick={handleNextStep}
                    disabled={paymentRestrictionInfo.hasConflict}
                  >
                    注文内容確認へ進む →
                  </Button>
                )}

                {currentStep === 2 && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentStep(1)}
                      disabled={isProcessing}
                    >
                      ← 戻る
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleConfirmStep}
                      disabled={isProcessing || paymentRestrictionInfo.hasConflict}
                    >
                      決済へ進む →
                    </Button>
                  </>
                )}

                {currentStep === 3 && (
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep(2)}
                    disabled={isProcessing}
                  >
                    ← 戻る
                  </Button>
                )}
              </Stack>
            </Box>
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
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => router.push('/orders')}
                  >
                    注文履歴を確認する →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Card Add Modal */}
        {isLoggedIn && (
          <CardAddModal
            isOpen={isAddCardModalOpen}
            onClose={() => setIsAddCardModalOpen(false)}
            onCardAdded={(newCard: SavedCard) => {
              // Add newly created card to savedCards and auto-select it
              console.log('[CHECKOUT] New card added:', newCard);
              setSavedCards([...savedCards, newCard]);
              setSelectedPaymentMethodId(newCard.id);
              setIsAddCardModalOpen(false);
            }}
            squareCustomerId={squareCustomerId || ''}
          />
        )}
      </Box>
    </CheckoutLayout>
  );
}
