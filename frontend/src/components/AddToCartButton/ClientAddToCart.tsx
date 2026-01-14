'use client';

import AddToCartButton from './AddToCartButton';

interface Props {
  id: string | number;
  name: string;
  price: number;
  image?: string;
}

export default function ClientAddToCart({ id, name, price, image }: Props) {
  return <AddToCartButton id={id} name={name} price={price} image={image} />;
}
