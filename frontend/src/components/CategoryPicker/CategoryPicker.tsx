'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';

// 「カテゴリから選ぶ」に表示するカテゴリ（本番DB Commerce-prod の内容を固定で記載）
// カテゴリやサブカテゴリを本番で追加・変更した場合はここも更新すること
const HOME_CATEGORIES: {
  id: string;
  name: string;
  image: string;
  subcategoryIds: string[];
}[] = [
  {
    id: '0db376ed-f3ae-4787-8709-f577519f3fd1',
    name: 'プリントシャツ',
    image: '/images/categories/print-shirt.png',
    subcategoryIds: [
      '8349c9bd-acb9-4e9e-bc6d-22f18710e442', // ロングＴシャツ
      'c9f15dd7-f518-4189-b76d-61cd132f2805', // Ｔシャツ
      'f149f62c-a4c9-4a9a-924c-ce99c015693b', // ポロシャツ
    ],
  },
  {
    id: '6a876996-c494-4154-b96d-b84cadb4834d',
    name: 'トレーニング用品',
    image: '/images/categories/training.png',
    subcategoryIds: [
      '2b1cfb23-1a31-4023-bd79-961b079ea089', // ボディメトリクス
    ],
  },
  {
    id: '8cc22c01-59d8-4eff-bc5c-f54da6f139e1',
    name: 'バレーボール',
    image: '/images/categories/volleyball.png',
    subcategoryIds: [
      '3636ca56-cc19-40d0-80b3-346113c4da4d', // ボールカゴ
      '3df996d1-fe85-4852-b51c-0df41516dd7f', // その他用具
      '47c98d99-2960-4cdb-9647-36b73e2a241a', // ゲームパンツ
      '74d898bc-42ca-43b5-a4ba-2fdfec111b72', // ボール【モルテン】
      'a005498c-c6c7-44db-b55b-b230a5ae60bb', // サポーター
      'bb302b5c-4050-4318-b930-2b9c8128353c', // バック
      'f05405ac-999a-4765-9e28-6b07daed06c8', // ボール【ミカサ】
    ],
  },
  {
    id: '9d910cde-00e2-4e16-b9ef-7975e1a89e27',
    name: 'スポーツウェア',
    image: '/images/categories/sportswear.png',
    subcategoryIds: [
      '1e3d191d-45e2-4464-8168-65dc7daab0bf', // バレーパンツ
      '953c5f79-e513-41f0-b0cd-8075cba42448', // インナー
      '9ed0cc26-b182-4763-9cd5-4ad90df4e8ec', // ソックス
      'bb583565-bf63-4501-ab9e-3a763456fc3d', // シャツ
    ],
  },
  {
    id: '9f573352-b0e5-4523-908e-5ad0096c8f86',
    name: 'オーダーユニフォーム',
    image: '/images/categories/order-uniform.png',
    subcategoryIds: [
      '96360a48-8931-44f8-8fb3-ba57562865b5', // hummel
    ],
  },
];

const buildCategorySearchHref = (subcategoryIds: string[]) =>
  `/search?categories=${subcategoryIds.join('&categories=')}`;

/**
 * 「カテゴリから選ぶ」セクション（ホーム・商品詳細で共通利用）
 */
export default function CategoryPicker() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        カテゴリから選ぶ
      </Typography>
      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        }}
      >
        {HOME_CATEGORIES.map((category) => (
          <Box
            key={`category-card-${category.id}`}
            component={Link}
            href={buildCategorySearchHref(category.subcategoryIds)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              minHeight: { xs: 104, sm: 136 },
              p: { xs: 1.25, sm: 1.75 },
              overflow: 'hidden',
              bgcolor: '#fff',
              color: '#111',
              textDecoration: 'none',
              border: '1.5px solid #111',
              borderRadius: 3,
              boxShadow: '4px 4px 0 #111',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              '& .category-card-image': {
                transition: 'transform 0.3s ease',
              },
              '&:hover': {
                transform: 'translate(2px, 2px)',
                boxShadow: '2px 2px 0 #111',
              },
              '&:hover .category-card-image': {
                transform: 'scale(1.06)',
              },
              '&:active': {
                transform: 'translate(4px, 4px)',
                boxShadow: '0 0 0 #111',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            {/* 商品写真をカード左寄せ・角丸で表示し、カテゴリ名を右側に重ねる */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 10 },
                bottom: { xs: 8, sm: 10 },
                left: { xs: 8, sm: 10 },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Image
                src={category.image}
                alt=""
                width={0}
                height={0}
                sizes="(min-width: 900px) 15vw, 30vw"
                className="category-card-image"
                style={{
                  height: '100%',
                  width: 'auto',
                  borderRadius: 8,
                }}
              />
            </Box>
            <Typography
              component="span"
              fontWeight={800}
              sx={{
                position: 'relative',
                textAlign: 'right',
                fontSize: { xs: '0.9rem', sm: '1.5rem' },
                lineHeight: 1.3,
                wordBreak: 'keep-all',
                overflowWrap: 'anywhere',
                // 写真と重なっても読めるよう白いフチを付ける
                textShadow:
                  '0 0 3px #fff, 0 0 3px #fff, 0 0 6px #fff, 0 0 6px #fff',
              }}
            >
              {category.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
