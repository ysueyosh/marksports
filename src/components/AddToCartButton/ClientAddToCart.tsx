'use client';

import AddToCartButton from './AddToCartButton';

interface Props {
  id: string | number;
  name: string;
  price: number;
}

export default function ClientAddToCart({ id, name, price }: Props) {
  return <AddToCartButton id={id} name={name} price={price} />;
}
