"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay,
} from "react-square-web-payments-sdk";
import CheckoutLayout from "@/components/Layout/CheckoutLayout";
import { submitPayment } from "@/app/actions/actions";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { usePaymentMethod } from "@/context/PaymentMethodContext";
import { getPriceWithTax } from "@/utils/price";
import styles from "./checkout.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { items: cartItems } = useCart();
  const { paymentMethods, addPaymentMethod } = usePaymentMethod();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<
    "credit_card" | "bank_transfer" | "apple_pay" | "google_pay"
  >("credit_card");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    prefecture: "",
    address: "",
    building: "",
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
    const total = subtotal + shippingFee + tax;
    // 税込み小計（商品代金 + 消費税）
    const subtotalWithTax = subtotal + tax;

    return {
      subtotal,
      subtotalWithTax,
      shippingFee,
      tax,
      total,
    };
  }, [cartItems]);

  // ログイン状態で配送先情報を自動入力
  useEffect(() => {
    if (isLoggedIn && user?.shippingAddress) {
      const { shippingAddress } = user;
      setFormData((prev) => ({
        ...prev,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: user.email || "",
        phone: shippingAddress.phone,
        postalCode: shippingAddress.postalCode,
        prefecture: shippingAddress.prefecture,
        address: shippingAddress.address,
        building: shippingAddress.building || "",
      }));
    }
  }, [isLoggedIn, user]);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const validateStep1 = (): boolean => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.postalCode ||
      !formData.prefecture ||
      !formData.address
    ) {
      setPaymentError("すべての必須項目を入力してください");
      return false;
    }
    return true;
  };

  const handlePayment = async (sourceId?: string) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let paymentSourceId: string;

      // 支払い方法ごとの処理
      switch (paymentMode) {
        case "credit_card":
          if (!sourceId) {
            setPaymentError("カード情報を入力してください");
            setIsProcessing(false);
            return;
          }
          paymentSourceId = sourceId;
          break;

        case "bank_transfer":
          // 口座振込は即座に完了
          paymentSourceId = `bank_${Date.now()}`;
          break;

        case "apple_pay":
          // Apple Pay のトークン取得処理
          paymentSourceId = `apple_pay_${Date.now()}`;
          break;

        case "google_pay":
          // Google Pay のトークン取得処理
          paymentSourceId = `google_pay_${Date.now()}`;
          break;

        default:
          setPaymentError("支払い方法を選択してください");
          setIsProcessing(false);
          return;
      }

      const result = await submitPayment({
        sourceId: paymentSourceId,
        amount: priceInfo.total,
        currency: "JPY",
        orderId: `ORDER_${Date.now()}`,
      });

      if (result && result.id) {
        router.push(`/orders?id=${result.id}`);
      } else {
        setPaymentError("決済処理中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "決済処理中にエラーが発生しました"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout>
      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        <button className={styles.navButton} onClick={() => router.push("/")}>
          ← トップに戻る
        </button>
        <button
          className={styles.navButton}
          onClick={() => router.push("/cart")}
        >
          ← カートに戻る
        </button>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>注文手続き</h1>
          <p>買い物を完成させましょう</p>
        </div>

        <div className={styles.steps}>
          <div
            className={`${styles.step} ${
              currentStep >= 1 ? styles.active : ""
            }`}
          >
            <span className={styles.stepNumber}>1</span>
            <span>配送情報入力</span>
          </div>
          <div
            className={`${styles.step} ${
              currentStep >= 2 ? styles.active : ""
            }`}
          >
            <span className={styles.stepNumber}>2</span>
            <span>注文内容確認</span>
          </div>
          <div
            className={`${styles.step} ${
              currentStep >= 3 ? styles.active : ""
            }`}
          >
            <span className={styles.stepNumber}>3</span>
            <span>決済</span>
          </div>
        </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {paymentError && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "4px",
                padding: "12px",
                marginBottom: "20px",
                color: "#991b1b",
              }}
            >
              ⚠️ {paymentError}
            </div>
          )}

          {currentStep === 1 && (
            <>
              {/* Shipping Information */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>配送先情報</legend>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>姓名 *</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="山田"
                      className={styles.input}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>名前 *</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="太郎"
                      className={styles.input}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>メールアドレス *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>電話番号 *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="090-1234-5678"
                    className={styles.input}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>郵便番号 *</label>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="100-0005"
                    className={styles.input}
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>都道府県 *</label>
                  <select
                    name="prefecture"
                    className={styles.select}
                    value={formData.prefecture}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="tokyo">東京都</option>
                    <option value="osaka">大阪府</option>
                    <option value="kyoto">京都府</option>
                    <option value="fukuoka">福岡県</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>住所 *</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="丸の内1-1-1"
                    className={styles.input}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>建物名（オプション）</label>
                  <input
                    type="text"
                    name="building"
                    placeholder="◇◇ビル 4階"
                    className={styles.input}
                    value={formData.building}
                    onChange={handleInputChange}
                  />
                </div>
              </fieldset>
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
                    marginBottom: "20px",
                    paddingBottom: "20px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "12px",
                    }}
                  >
                    配送先情報
                  </h3>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.8",
                    }}
                  >
                    <p>
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p>〒{formData.postalCode}</p>
                    <p>
                      {formData.prefecture} {formData.address}
                    </p>
                    {formData.building && <p>{formData.building}</p>}
                    <p>{formData.email}</p>
                    <p>{formData.phone}</p>
                  </div>
                </div>

                {/* Order Items */}
                {cartItems.length > 0 && (
                  <div
                    style={{
                      marginBottom: "20px",
                      paddingBottom: "20px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "12px",
                      }}
                    >
                      商品
                    </h3>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          marginBottom: "8px",
                          color: "#6b7280",
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
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      marginBottom: "8px",
                      color: "#6b7280",
                    }}
                  >
                    <span>小計</span>
                    <span>¥{priceInfo.subtotalWithTax.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "8px",
                      textAlign: "right",
                    }}
                  >
                    （内消費税 ¥{priceInfo.tax.toLocaleString()}）
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      marginBottom: "8px",
                      color: "#6b7280",
                    }}
                  >
                    <span>送料</span>
                    <span>¥{priceInfo.shippingFee.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "16px",
                      fontWeight: "600",
                      paddingTop: "12px",
                      borderTop: "1px solid #e5e7eb",
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
                      marginBottom: "20px",
                      paddingBottom: "20px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "10px",
                      }}
                    >
                      商品
                    </h3>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          marginBottom: "8px",
                          color: "#6b7280",
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
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginBottom: "8px",
                    textAlign: "right",
                    paddingRight: "0",
                  }}
                >
                  （内消費税 ¥{priceInfo.tax.toLocaleString()}）
                </div>
                <div className={styles.summaryItem}>
                  <span>送料</span>
                  <span>¥{priceInfo.shippingFee.toLocaleString()}</span>
                </div>

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
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="bank_transfer"
                      checked={paymentMode === "bank_transfer"}
                      onChange={() => {
                        setPaymentMode("bank_transfer");
                        setSelectedPaymentMethodId(null);
                      }}
                      style={{ marginRight: "12px" }}
                    />
                    口座振込
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="credit_card"
                      checked={paymentMode === "credit_card"}
                      onChange={() => {
                        setPaymentMode("credit_card");
                        setSelectedPaymentMethodId(null);
                      }}
                      style={{ marginRight: "12px" }}
                    />
                    クレジットカード
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="apple_pay"
                      checked={paymentMode === "apple_pay"}
                      onChange={() => {
                        setPaymentMode("apple_pay");
                        setSelectedPaymentMethodId(null);
                      }}
                      style={{ marginRight: "12px" }}
                    />
                    Apple Pay
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="google_pay"
                      checked={paymentMode === "google_pay"}
                      onChange={() => {
                        setPaymentMode("google_pay");
                        setSelectedPaymentMethodId(null);
                      }}
                      style={{ marginRight: "12px" }}
                    />
                    Google Pay
                  </label>
                </div>

                {/* Credit Card Payment */}
                {paymentMode === "credit_card" && (
                  <PaymentForm
                    applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                    locationId="LP30F7K9QGGXC"
                    cardTokenizeResponseReceived={async (token: any) => {
                      if (token.status === "OK") {
                        await handlePayment(token.token);
                      } else {
                        setPaymentError(
                          token.errors?.[0]?.message ||
                            "トークン生成中にエラーが発生しました"
                        );
                      }
                    }}
                  >
                    <div>
                      <h4 style={{ marginBottom: "15px" }}>
                        クレジットカード情報
                      </h4>

                      {/* Saved Cards Section */}
                      <div style={{ marginBottom: "20px" }}>
                        <h5 style={{ marginBottom: "10px", fontSize: "14px" }}>
                          保存済みカードから選択
                        </h5>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="saved_card"
                              value="sandbox_4111"
                              checked={
                                selectedPaymentMethodId === "sandbox_4111"
                              }
                              onChange={(e) =>
                                setSelectedPaymentMethodId(e.target.value)
                              }
                              style={{ marginRight: "10px" }}
                            />
                            <span>•••• •••• •••• 1111 (Sandbox Test Card)</span>
                          </label>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="saved_card"
                              value="new_card"
                              checked={selectedPaymentMethodId === "new_card"}
                              onChange={(e) =>
                                setSelectedPaymentMethodId(e.target.value)
                              }
                              style={{ marginRight: "10px" }}
                            />
                            <span>新しいカードを追加</span>
                          </label>
                        </div>
                      </div>

                      {/* New Card Form */}
                      {selectedPaymentMethodId === "new_card" && (
                        <div style={{ marginBottom: "20px" }}>
                          <CreditCard />
                        </div>
                      )}

                      {/* Saved Card Info */}
                      {selectedPaymentMethodId === "sandbox_4111" && (
                        <div
                          style={{
                            padding: "15px",
                            backgroundColor: "#f3f4f6",
                            borderRadius: "4px",
                            marginBottom: "20px",
                            fontSize: "14px",
                          }}
                        >
                          <p style={{ marginBottom: "8px" }}>
                            <strong>カード番号:</strong> •••• •••• •••• 1111
                          </p>
                          <p style={{ marginBottom: "8px" }}>
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
                {paymentMode === "bank_transfer" && (
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "15px",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <h4 style={{ marginBottom: "10px" }}>口座振込情報</h4>
                    <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <strong>銀行:</strong> 〇〇銀行
                    </p>
                    <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <strong>支店:</strong> 〇〇支店
                    </p>
                    <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <strong>口座種別:</strong> 普通
                    </p>
                    <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <strong>口座番号:</strong> 1234567
                    </p>
                    <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <strong>名義人:</strong> マークスポーツ
                    </p>
                    <p
                      style={{
                        marginTop: "15px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      ご注文完了後、上記の口座にお振込みください。口座情報はメールでも送信いたします。振込確認後、商品の発送手配をいたします。
                    </p>
                  </div>
                )}

                {/* Apple Pay */}
                {paymentMode === "apple_pay" && (
                  <div>
                    <h4 style={{ marginBottom: "15px" }}>Apple Pay</h4>
                    <p
                      style={{
                        marginBottom: "15px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      iPhone または iPad の Apple Pay で支払います。Safari
                      ブラウザ上でのみご利用いただけます。
                    </p>
                    <PaymentForm
                      applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                      locationId="LP30F7K9QGGXC"
                      createPaymentRequest={() => ({
                        countryCode: "JP",
                        currencyCode: "JPY",
                        lineItems: [
                          {
                            amount: String(priceInfo.subtotal),
                            label: "商品代金",
                            pending: false,
                          },
                          {
                            amount: String(priceInfo.shippingFee),
                            label: "送料",
                            pending: false,
                          },
                          {
                            amount: String(priceInfo.tax),
                            label: "消費税",
                            pending: false,
                          },
                        ],
                        requestShippingAddress: false,
                        requestBillingInfo: false,
                        total: {
                          amount: String(priceInfo.total),
                          label: "合計",
                        },
                      })}
                      cardTokenizeResponseReceived={async (token: any) => {
                        if (token.status === "OK") {
                          await handlePayment(token.token);
                        } else {
                          setPaymentError(
                            token.errors?.[0]?.message ||
                              "トークン生成中にエラーが発生しました"
                          );
                        }
                      }}
                    >
                      <ApplePay />
                    </PaymentForm>
                  </div>
                )}

                {/* Google Pay */}
                {paymentMode === "google_pay" && (
                  <div>
                    <h4 style={{ marginBottom: "15px" }}>Google Pay</h4>
                    <p
                      style={{
                        marginBottom: "15px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Android デバイスの Google Pay
                      で支払います。対応ブラウザ上でのみご利用いただけます。
                    </p>
                    <PaymentForm
                      applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
                      locationId="LP30F7K9QGGXC"
                      createPaymentRequest={() => ({
                        countryCode: "JP",
                        currencyCode: "JPY",
                        lineItems: [
                          {
                            amount: String(priceInfo.subtotal),
                            label: "商品代金",
                            pending: false,
                          },
                          {
                            amount: String(priceInfo.shippingFee),
                            label: "送料",
                            pending: false,
                          },
                          {
                            amount: String(priceInfo.tax),
                            label: "消費税",
                            pending: false,
                          },
                        ],
                        requestShippingAddress: false,
                        requestBillingInfo: false,
                        total: {
                          amount: String(priceInfo.total),
                          label: "合計",
                        },
                      })}
                      cardTokenizeResponseReceived={async (token: any) => {
                        if (token.status === "OK") {
                          await handlePayment(token.token);
                        } else {
                          setPaymentError(
                            token.errors?.[0]?.message ||
                              "トークン生成中にエラーが発生しました"
                          );
                        }
                      }}
                    >
                      <GooglePay />
                    </PaymentForm>
                  </div>
                )}

                {/* Purchase Button - only for bank transfer */}
                {paymentMode === "bank_transfer" && (
                  <div style={{ marginTop: "20px" }}>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={() => handlePayment()}
                      disabled={isProcessing}
                      style={{
                        opacity: isProcessing ? 0.6 : 1,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        width: "100%",
                      }}
                    >
                      {isProcessing ? "処理中..." : "購入する"}
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
      </div>
    </CheckoutLayout>
  );
}
