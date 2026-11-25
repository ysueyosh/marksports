'use client';

import AddToCartButton from './AddToCartButton';

interface Props {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  selectedOptionChoiceId?: string;
  selectedOptionChoiceName?: string;
  additionalPrice?: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  paymentMethodRestriction?: string | null;
  /** 商品備考（お客様の入力内容） */
  itemNote?: string;
  disabled?: boolean;
}

export default function ClientAddToCart({
  id,
  name,
  price,
  image,
  size,
  color,
  selectedOptionChoiceId,
  selectedOptionChoiceName,
  additionalPrice,
  minQuantity,
  maxQuantity,
  paymentMethodRestriction,
  itemNote,
  disabled,
}: Props) {
  return (
    <AddToCartButton
      id={id}
      name={name}
      price={price}
      image={image}
      size={size}
      color={color}
      selectedOptionChoiceId={selectedOptionChoiceId}
      selectedOptionChoiceName={selectedOptionChoiceName}
      additionalPrice={additionalPrice}
      minQuantity={minQuantity}
      maxQuantity={maxQuantity}
      paymentMethodRestriction={paymentMethodRestriction}
      itemNote={itemNote}
      disabled={disabled}
    />
  );
}
