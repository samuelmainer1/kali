/**
 * Publish three SEO landing articles on the live catalogue.
 *
 *   node server/scripts/addSeoBlogPosts.js
 *   touch server/src/index.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { updateDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://www.bigdrop.co.ke';

export const POSTS = [
  {
    id: 'blog_shop_mpesa',
    slug: 'shop-online-kenya-mpesa',
    title: 'How to Shop Online in Kenya and Pay with M-Pesa',
    excerpt:
      'Order from BigDrop Kenya, pay with Lipa na M-Pesa Buy Goods till 862294, and get your parcel delivered by Globeflight.',
    metaDescription:
      'Shop online in Kenya on BigDrop. Pay with Lipa na M-Pesa, Buy Goods till 862294. Nationwide delivery by Globeflight from NextGen Mall, Nairobi.',
    imageAlt: 'Customer paying for an online order with M-Pesa on a phone in Kenya',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    author: 'BigDrop Team',
    tags: ['shopping', 'mpesa', 'kenya'],
    ctaLabel: 'Start shopping on BigDrop',
    ctaUrl: `${SITE}/shop`,
    publishedAt: '2026-10-02T08:00:00.000Z',
    content: `Looking for a trusted place to shop online in Kenya? BigDrop Kenya is a multi-vendor store for groceries, electronics, fashion, health and beauty, and home goods — with payment on M-Pesa and delivery by Globeflight.

You do not need a card. At checkout, pay with Lipa na M-Pesa, Buy Goods and Services, till 862294. If the STK prompt appears on your phone, enter your PIN. If it does not, open M-Pesa and pay that till yourself, then keep your confirmation message.

> Shop from Nairobi or anywhere in Kenya. Pay with M-Pesa. We pick, pack and deliver.

## Why Kenyans search for online shopping with M-Pesa

Most shoppers in Kenya already use M-Pesa every day. They want an online store that accepts it clearly, shows the till, and delivers to a real address — not a site that only talks about cards.

BigDrop is built for that. Browse [the shop](${SITE}/shop), add items to your cart, and pay in Kenyan shillings. Card checkout is coming soon. M-Pesa is ready now.

## How to place an order on BigDrop

### 1. Find what you need

Use search or open a category such as [groceries](${SITE}/category/groceries), [phones and tablets](${SITE}/category/phone-tablet), [health and beauty](${SITE}/category/beauty-health), or [TVs and electronics](${SITE}/category/tvs-electronics).

### 2. Check the product page

Each listing shows the price in KSh, photos, and who is selling. Approved products are the ones you can buy.

### 3. Checkout with M-Pesa

Enter your delivery details. Choose M-Pesa. Watch for the STK prompt, or pay till 862294 under Buy Goods and Services. There is no account number. Then you can [track your order](${SITE}/track) once Globeflight has the parcel.

## Till 862294 is Buy Goods, not Paybill

When you pay by hand: Lipa na M-Pesa → Buy Goods and Services → till 862294. Do not use Paybill for this shop. Using the wrong option delays confirmation.

Need help at checkout? Read the [help centre](${SITE}/help) or call +254 722 359 298.

## Delivery after you pay

Orders are fulfilled from NextGen Mall, Mombasa Road, Nairobi. Globeflight delivers across Kenya. In Nairobi, many orders go out the same business day. Other towns usually take two to five days. Read [shipping and fulfillment](${SITE}/fulfillment) for timelines.

## Shop online in Kenya with confidence

BigDrop Kenya brings local and international brands into one cart, billed in KSh, paid on M-Pesa, and delivered by a Kenyan courier you can track. Open [BigDrop shop](${SITE}/shop) and place your first order.`,
  },
  {
    id: 'blog_nairobi_delivery',
    slug: 'same-day-delivery-nairobi-kenya',
    title: 'Same-Day Delivery in Nairobi: How BigDrop Delivers Across Kenya',
    excerpt:
      'Same business day in Nairobi, two to five days nationwide. See how BigDrop and Globeflight pick, pack and deliver from NextGen Mall.',
    metaDescription:
      'Same-day delivery in Nairobi with BigDrop and Globeflight. Nationwide shipping in 2–5 days from NextGen Mall. Track every order online.',
    imageAlt: 'Globeflight delivery van on a Nairobi road',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
    author: 'BigDrop Team',
    tags: ['delivery', 'nairobi', 'globeflight'],
    ctaLabel: 'See shipping and fulfillment',
    ctaUrl: `${SITE}/fulfillment`,
    publishedAt: '2026-10-02T08:30:00.000Z',
    content: `If you searched for same-day delivery in Nairobi, you want a store that actually dispatches from the city — not a foreign warehouse with a Kenyan domain.

BigDrop Kenya fulfills from NextGen Mall, Mombasa Road, 3rd Floor, Suite 40. Last-mile is Globeflight Kenya. That is why Nairobi orders can leave the same business day, and upcountry parcels still move on a known Kenyan network.

> Usually the same business day within Nairobi; two to five days elsewhere in Kenya.

## How a BigDrop delivery works

You order on [bigdrop.co.ke](${SITE}/shop) and pay with M-Pesa (Buy Goods till 862294). We pick the items, pack them, and hand them to Globeflight. You get updates, and you can [track the shipment](${SITE}/track) with your tracking number.

Sellers who store stock with us never have to ride across Nairobi with a box. We pick from the shelf and Globeflight takes it to the door. If you sell, read how to [sell on BigDrop](${SITE}/sell).

## Nairobi versus the rest of Kenya

Nairobi and nearby areas are the fastest lane. Place the order early on a business day for the best chance of same-day arrival. Mombasa, Kisumu, Nakuru, Eldoret and other towns typically land in two to five days, depending on the route.

We do not promise a miracle overnight to every village. We promise a real courier, a real warehouse, and a tracking number.

## What to prepare for a smooth drop

Use a phone that can receive M-Pesa and rider calls. Write a clear address: estate, building, and nearest landmark. If you will not be home, name a neighbour or office reception.

Returns are explained on our [returns page](${SITE}/returns). Questions sit in the [help centre](${SITE}/help).

## Online shopping that includes the last mile

A catalogue is only useful if the parcel arrives. BigDrop is the shop. Globeflight is the delivery. Together they cover Kenya from one Nairobi hub.

Shop [electronics](${SITE}/category/tvs-electronics), [phones](${SITE}/category/phone-tablet), [home](${SITE}/category/household) or [fashion](${SITE}/category/fashion), pay on M-Pesa, and let Globeflight finish the job.`,
  },
  {
    id: 'blog_groceries_kenya',
    slug: 'buy-groceries-online-kenya',
    title: 'Buy Groceries and Household Essentials Online in Kenya',
    excerpt:
      'Order rice, cooking oil, cleaning supplies and everyday brands on BigDrop Kenya. Pay with M-Pesa. We deliver with Globeflight.',
    metaDescription:
      'Buy groceries online in Kenya from BigDrop. Rice, oil, household cleaners and more. Pay with M-Pesa till 862294. Delivery by Globeflight.',
    imageAlt: 'Grocery and household products on a kitchen counter',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    author: 'BigDrop Team',
    tags: ['groceries', 'household', 'shopping'],
    ctaLabel: 'Shop groceries on BigDrop',
    ctaUrl: `${SITE}/category/groceries`,
    publishedAt: '2026-10-02T09:00:00.000Z',
    content: `Running out of rice, cooking oil or washing powder should not mean a long queue. You can buy groceries and household essentials online in Kenya on BigDrop, pay with M-Pesa, and have Globeflight deliver.

Open [groceries](${SITE}/category/groceries) for food staples and [household](${SITE}/category/household) for cleaning and everyday home supplies. Add [health and beauty](${SITE}/category/beauty-health) if you also need lotion, soap or skincare in the same order.

> One cart for food, home and personal care. One M-Pesa payment. One delivery.

## What Kenyans order online for the home

Staples such as maize flour, sugar, oil and milk sit next to toilet paper, detergent and soap. You can fill a monthly basket without hopping between three unrelated apps.

BigDrop is a multi-vendor marketplace, so you will see familiar Kenyan and international brands. Check the product photo, price in KSh, and seller name before you pay.

## How grocery delivery works

Pay at checkout with Lipa na M-Pesa, Buy Goods and Services, till 862294. We pack from NextGen Mall in Nairobi. Nairobi deliveries are often the same business day. Other counties usually take two to five days. Details are on [fulfillment](${SITE}/fulfillment).

Fresh produce and chilled goods depend on what is listed that day. If an item is not in the catalogue, it is not for sale. What you see is what we can pick.

## Pay once, receive at home

You do not need a card. M-Pesa is the live payment method. If STK does not pop up, pay till 862294 yourself. Then keep the message until the order shows as paid.

New to the site? Start on [the shop](${SITE}/shop), or jump straight to [food and drinks](${SITE}/category/food-drinks).

## A Kenyan supermarket aisle, online

BigDrop is for people who already shop in Nairobi malls and now want the same goods at home in Kisumu, Eldoret or Mombasa. The warehouse is local. The courier is Globeflight. The till is Kenyan.

When the pantry is low, open BigDrop, pay with M-Pesa, and let the rider bring the bags.`,
  },
];

function upsertPosts(list) {
  const next = [...(list || [])];
  for (const post of [...POSTS].reverse()) {
    const row = {
      ...post,
      published: true,
      updatedAt: new Date().toISOString(),
    };
    const idx = next.findIndex((p) => p.id === post.id || p.slug === post.slug);
    if (idx >= 0) next[idx] = { ...next[idx], ...row };
    else next.unshift(row);
  }
  return next;
}

function run() {
  const live = updateDb(
    (db) => {
      db.blogPosts = upsertPosts(db.blogPosts);
      return db.blogPosts.filter((p) => POSTS.some((x) => x.slug === p.slug)).map((p) => p.slug);
    },
    { actor: 'system', action: 'blog.seoLaunch', detail: 'Publish three SEO launch articles' }
  );

  const seedPath = path.join(__dirname, '../data/seed.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  seed.blogPosts = upsertPosts(seed.blogPosts);
  fs.writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`);
  console.log({ live, seedCount: seed.blogPosts.length });
}

const invoked = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invoked) run();
