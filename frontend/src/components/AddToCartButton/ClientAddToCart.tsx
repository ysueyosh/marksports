'use client';

import AddToCartButton from './AddToCartButton';

interface Props {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  disabled?: boolean;
}

export default function ClientAddToCart({
  id,
  name,
  price,
  image,
  size,
  color,
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
      disabled={disabled}
    />
  );
}
