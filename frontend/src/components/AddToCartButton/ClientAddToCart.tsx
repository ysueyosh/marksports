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
      disabled={disabled}
    />
  );
}
