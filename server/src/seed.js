import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { DEFAULT_COUPONS, DEFAULT_HOME_BLOCKS, DEFAULT_FAQS, FEATURED_CATEGORY_SLUGS, defaultVendorHours } from './commerce.js';
import { dataDir, dbPath } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hash = await bcrypt.hash('password123', 10);
const now = new Date().toISOString();

/** Brands for every category — used in shop filters (Amazon/Jumia style) */
const brandsByCat = {
  cat_phones: ['Samsung', 'Apple', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Nokia', 'Huawei'],
  cat_food: ['Nestlé', 'Coca-Cola', 'Del Monte', 'Bidco', 'Brookside', 'Cadbury', 'Kericho Gold'],
  cat_computers: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Logitech'],
  cat_beauty: ["L'Oréal", 'Nivea', 'Maybelline', 'Garnier', 'CeraVe', 'The Ordinary', 'No7'],
  cat_home: ['IKEA', 'Godrej', 'Homey', 'Meko', 'Ashley', 'Local Craft'],
  cat_groceries: ['Unga', 'Bidco', 'Pembe', 'Brookside', 'Menengai', 'Safaricom Fresh'],
  cat_appliances: ['Samsung', 'LG', 'Hisense', 'Ramtons', 'Hotpoint', 'Syinix'],
  cat_gaming: ['Sony', 'Microsoft', 'Nintendo', 'Razer', 'Logitech', 'SteelSeries'],
  cat_jewelry: ['Casio', 'Fossil', 'Rolex', 'Citizen', 'Local Artisan', 'Seiko'],
  cat_books: ['Longman', 'Oxford', 'Bic', 'Pilot', 'Penguin', 'East African'],
  cat_toys: ['LEGO', 'Hasbro', 'Mattel', 'Hot Wheels', 'Fisher-Price', 'Nerf'],
  cat_sports: ['Nike', 'Adidas', 'Puma', 'Decathlon', 'Under Armour', 'Reebok'],
  cat_fashion: ['Nike', 'Adidas', 'Zara', 'H&M', 'Local Designers', "Levi's"],
  cat_baby: ['Pampers', 'Huggies', "Johnson's", 'Fisher-Price', 'Chicco', 'Philips Avent'],
  cat_auto: ['Bosch', 'Michelin', 'Castrol', 'Toyota', 'Mobil', '3M'],
  cat_pets: ['Pedigree', 'Whiskas', 'Royal Canin', 'Kong', 'Seresto', 'Local Pet'],
  cat_garden: ['Bosch', 'Gardena', 'Fiskars', 'Miracle-Gro', 'Local Garden', 'Black+Decker'],
  cat_music: ['Yamaha', 'Casio', 'Fender', 'Donner', 'Audio-Technica', 'Local Music'],
  cat_tv: ['Samsung', 'LG', 'Hisense', 'Sony', 'TCL', 'Vitron'],
  cat_household: ['Bidco', 'Ariel', 'Sunlight', 'Dettol', 'Air Wick', 'Always'],
  cat_power: ['Sun King', 'd.light', 'Sollatek', 'Mustek', 'Victron', 'Jinko'],
  cat_furniture: ['IKEA', 'Woodmarc', 'Meko', 'Ashley', 'Local Craft', 'Victoria'],
  cat_wine: ['Robertson', 'KWV', 'Four Cousins', 'Tusker', 'Guinness', 'Smirnoff'],
  cat_pharmacy: ['Panadol', 'Betadine', 'Dettol', 'Always', 'Oral-B', 'Johnson & Johnson'],
};

/** 24 categories — marketplace mix including power, furniture, wine, pharmacy */
const categories = [
  { id: 'cat_phones', name: 'Phone & Tablet', slug: 'phone-tablet', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80', description: 'Smartphones, tablets and mobile accessories.', brands: brandsByCat.cat_phones },
  { id: 'cat_food', name: 'Food & Drinks', slug: 'food-drinks', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=900&q=80', description: 'Beverages, snacks and ready-to-enjoy foods.', brands: brandsByCat.cat_food },
  { id: 'cat_computers', name: 'Computers & Laptop', slug: 'computers-laptop', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&q=80', description: 'Laptops, PCs and computing accessories.', brands: brandsByCat.cat_computers },
  { id: 'cat_beauty', name: 'Beauty & Health', slug: 'beauty-health', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80', description: 'Skincare, wellness and personal care.', brands: brandsByCat.cat_beauty },
  { id: 'cat_home', name: 'Home & Office', slug: 'home-office', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80', description: 'Furniture, décor and workplace essentials.', brands: brandsByCat.cat_home },
  { id: 'cat_groceries', name: 'Groceries', slug: 'groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80', description: 'Pantry food and everyday cooking staples.', brands: brandsByCat.cat_groceries },
  { id: 'cat_appliances', name: 'Appliances', slug: 'appliances', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80', description: 'Kitchen and home appliances including fridges.', brands: brandsByCat.cat_appliances },
  { id: 'cat_tv', name: 'TVs & Electronics', slug: 'tvs-electronics', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80', description: 'Smart TVs, soundbars and home electronics.', brands: brandsByCat.cat_tv },
  { id: 'cat_household', name: 'Household', slug: 'household', image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=900&q=80', description: 'Tissues, cleaners, detergents and home care.', brands: brandsByCat.cat_household },
  { id: 'cat_gaming', name: 'Gaming', slug: 'gaming', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=900&q=80', description: 'Consoles, games and gaming gear.', brands: brandsByCat.cat_gaming },
  { id: 'cat_jewelry', name: 'Jewelry & Watches', slug: 'jewelry-watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&q=80', description: 'Watches, rings and fine accessories.', brands: brandsByCat.cat_jewelry },
  { id: 'cat_books', name: 'Books & Stationery', slug: 'books-stationery', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=900&q=80', description: 'Books, notebooks and stationery.', brands: brandsByCat.cat_books },
  { id: 'cat_toys', name: 'Toys & Games', slug: 'toys-games', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900&q=80', description: 'Toys, puzzles and family games.', brands: brandsByCat.cat_toys },
  { id: 'cat_sports', name: 'Sports & Outdoors', slug: 'sports-outdoors', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80', description: 'Fitness, outdoor and sports gear.', brands: brandsByCat.cat_sports },
  { id: 'cat_fashion', name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80', description: 'Clothing, shoes and style for everyone.', brands: brandsByCat.cat_fashion },
  { id: 'cat_baby', name: 'Baby & Kids', slug: 'baby-kids', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900&q=80', description: 'Essentials for babies and children.', brands: brandsByCat.cat_baby },
  { id: 'cat_auto', name: 'Automobile', slug: 'automobile', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=80', description: 'Car accessories, care and spare essentials.', brands: brandsByCat.cat_auto },
  { id: 'cat_pets', name: 'Pet Care', slug: 'pet-care', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&q=80', description: 'Food, beds and gear for dogs and cats.', brands: brandsByCat.cat_pets },
  { id: 'cat_garden', name: 'Garden & DIY', slug: 'garden-diy', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80', description: 'Tools, plants and outdoor DIY supplies.', brands: brandsByCat.cat_garden },
  { id: 'cat_music', name: 'Musical Instruments', slug: 'musical-instruments', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=900&q=80', description: 'Guitars, keyboards and studio gear.', brands: brandsByCat.cat_music },
  { id: 'cat_power', name: 'Power & Solar', slug: 'power-solar', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80', description: 'Solar panels, inverters, batteries and backup power.', brands: brandsByCat.cat_power },
  { id: 'cat_furniture', name: 'Furniture', slug: 'furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80', description: 'Sofas, beds, tables and home furniture.', brands: brandsByCat.cat_furniture },
  { id: 'cat_wine', name: 'Wine & Spirits', slug: 'wine-spirits', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80', description: 'Wine, beer and spirits for responsible adult shoppers.', brands: brandsByCat.cat_wine },
  { id: 'cat_pharmacy', name: 'Pharmacy', slug: 'pharmacy', image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900&q=80', description: 'OTC medicines, first aid and wellness essentials.', brands: brandsByCat.cat_pharmacy },
];

const reviewAuthors = ['Amina K.', 'Brian O.', 'Faith W.', 'Kevin M.', 'Grace N.', 'John M.', 'Sarah W.', 'David K.', 'Mercy A.', 'Peter L.'];
const reviewComments = [
  'Great quality for the price. Delivery was fast with Globeflight.',
  'Exactly as described. Would buy again from BigDrop.',
  'Packaging was secure and item works perfectly.',
  'Good value. Arrived earlier than expected.',
  'Solid product — matches the photos and description.',
  'Happy with this purchase. Recommended seller.',
  'Used for a week now and still impressed.',
  'Fair price compared to other shops in Nairobi.',
];

function makeReviews(seed, count, avgRating) {
  const list = [];
  for (let r = 0; r < count; r++) {
    const rating = Math.min(5, Math.max(1, Math.round(avgRating + ((seed + r) % 3) - 1)));
    list.push({
      id: `rev_${seed}_${r}`,
      author: reviewAuthors[(seed + r) % reviewAuthors.length],
      rating,
      title: rating >= 4 ? 'Recommended' : rating >= 3 ? 'Okay overall' : 'Could be better',
      comment: reviewComments[(seed + r) % reviewComments.length],
      date: new Date(Date.UTC(2026, (seed + r) % 8, 1 + ((seed + r) % 27))).toISOString().slice(0, 10),
      verified: (seed + r) % 3 !== 0,
      image: r === 0 && seed % 7 === 0
        ? 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=400&q=80'
        : '',
    });
  }
  return list;
}

// Each product gets a distinct Unsplash photo that matches the product type/name
const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const catalog = {
  cat_phones: [
    ['Samsung Galaxy A15 128GB', 18500, 21000, u('photo-1610945415295-d9bbf067e59c'), 'Samsung'],
    ['Apple iPhone 13 Refurb 128GB', 52000, 58000, u('photo-1510557880182-3d4d3cba35a5'), 'Apple'],
    ['Tecno Spark 20 Pro 256GB', 18900, 21500, u('photo-1511707171634-5f897ff02aa9'), 'Tecno'],
    ['Infinix Note 40 256GB', 21500, 24900, u('photo-1592899677977-9c10ca588bbd'), 'Infinix'],
    ['Xiaomi Redmi Note 13', 19800, 22500, u('photo-1598327105666-5b89351aff97'), 'Xiaomi'],
    ['Oppo A78 5G', 24500, 27900, u('photo-1580910051074-3eb694886505'), 'Oppo'],
    ['Nokia G42 5G', 16800, 18900, u('photo-1601784551446-20c9e07cdbdb'), 'Nokia'],
    ['Huawei FreeBuds SE', 4500, 5200, u('photo-1590658268037-6bf12165a8df'), 'Huawei'],
    ['Samsung Galaxy Tab A9', 22000, 25500, u('photo-1544244015-0df4b3ffc6b0'), 'Samsung'],
    ['Apple AirPods Case Clear', 2500, 3200, u('photo-1600294037681-c80b4cb5b434'), 'Apple'],
  ],
  cat_food: [
    ['Organic Honey 500g', 850, 950, u('photo-1587049352846-4a222e784d38'), 'Del Monte'],
    ['Arabica Coffee Beans 1kg', 1650, 1900, u('photo-1447933601403-0c6688de566e'), 'Kericho Gold'],
    ['Green Tea Bags (100)', 750, 900, u('photo-1571934811356-5cc061b6821f'), 'Kericho Gold'],
    ['Sparkling Water Case (24)', 980, 1200, u('photo-1556679343-c7306c1976bc'), 'Coca-Cola'],
    ['Mixed Nuts Pack 500g', 980, 1150, u('photo-1599599810769-bcde5a160d32'), 'Cadbury'],
    ['Dark Chocolate Bars Pack', 650, 800, u('photo-1481391319762-47dff72954d9'), 'Cadbury'],
    ['Fruit Juice Assorted 6-Pack', 720, 890, u('photo-1600271886742-f049cd451bba'), 'Del Monte'],
    ['Protein Energy Bars (12)', 1450, 1700, u('photo-1622483767028-3f66f32aef97'), 'Nestlé'],
    ['Herbal Infusion Sampler', 890, 1100, u('photo-1576092768241-dec231879fc3'), 'Kericho Gold'],
    ['Instant Oats Family Pack', 580, 720, u('photo-1517677208171-0bc6725a3e60'), 'Nestlé'],
  ],
  cat_computers: [
    ['Wireless Keyboard Compact', 3200, 3800, u('photo-1587829741301-dc798b83add3')],
    ['Ergonomic Wireless Mouse', 1450, 1800, u('photo-1527864550417-7fd91fc51a46')],
    ['USB Hub 4-Port', 1450, 1800, u('photo-1625948515291-69613efd103f')],
    ['Laptop Sleeve 15"', 2100, 2500, u('photo-1541807084-5c52b6b3adef')],
    ['HD Webcam 1080p', 4100, 4800, u('photo-1587826080692-f439cd0b70da')],
    ['Monitor Stand Riser', 2800, 3300, u('photo-1527443224154-c4a3942d3acf')],
    ['External SSD 1TB', 8900, 10500, u('photo-1597872200969-2b65d56bd16b')],
    ['Laptop Cooling Pad', 2400, 2900, u('photo-1588702547919-26089e690ecc')],
    ['HDMI Cable 2m Braided', 750, 950, u('photo-1558618666-fcd25c85cd64')],
    ['USB-C Docking Station', 6500, 7800, u('photo-1593640408182-31c70c8268f5')],
  ],
  cat_beauty: [
    ["L'Oréal Revitalift Cream", 4680, 5200, u('photo-1556228578-8c89e6adf883')],
    ['Snail Mucin Sheet Mask (10pcs)', 4680, null, u('photo-1596755389378-c31d21fd1273')],
    ['Vitamin C Face Wash', 1450, 1700, u('photo-1620916566398-39f1143ab7be')],
    ['Shea Butter Body Lotion', 980, 1200, u('photo-1608248597279-f99d160bfcbc')],
    ['Matte Liquid Lipstick Set', 2100, 2500, u('photo-1586495777744-4413f21062fa')],
    ['Hair Growth Oil Blend', 1750, 2000, u('photo-1527799820374-dcf8d9d4a388')],
    ['SPF 50 Sunscreen Lotion', 1650, null, u('photo-1556228453-efd6c1ff04f6')],
    ['Aloe Vera Gel Pure 250ml', 750, 900, u('photo-1608571423902-eed4a5ad8108')],
    ['Electric Facial Cleansing Brush', 3200, 3900, u('photo-1598440947619-2c35fc9aa908')],
    ['No7 HydraLuminous Day Gel', 2658, 3100, u('photo-1571781926291-c477ebfd024b')],
  ],
  cat_home: [
    ['Memory Foam Pillow Pair', 3200, 3800, u('photo-1631049307264-da0ec9d70304')],
    ['Ceramic Plant Pot Set', 2100, 2500, u('photo-1485955900006-10f4d324d411')],
    ['Cotton Bed Sheet Set Queen', 4500, 5200, u('photo-1522771739844-6a9f6d5f14af')],
    ['Desk Organizer Bamboo', 1650, 2000, u('photo-1497366216548-37526070297c')],
    ['Wall Clock Minimalist', 1750, 2100, u('photo-1563861826100-9cb868fdbe1c')],
    ['LED String Lights 10m', 950, 1200, u('photo-1578662996442-48f60103fc96')],
    ['Ergonomic Desk Chair', 12500, 14900, u('photo-1580480055273-228ff5388ef8')],
    ['Folding Laundry Basket', 1250, 1500, u('photo-1584622650111-993a426fbf0a')],
    ['Whiteboard Magnetic 60x90', 3500, 4200, u('photo-1611224923853-80b023f02d71')],
    ['Scented Candle Trio', 1400, null, u('photo-1602526432604-029a709e131c')],
  ],
  cat_groceries: [
    ['Basmati Rice 5kg', 1200, 1400, u('photo-1586201375761-83865001e31c'), 'Pembe'],
    ['Cooking Oil 2L', 720, 850, u('photo-1472220625704-91e1462799b2'), 'Bidco'],
    ['Tomato Sauce Multipack', 650, 780, u('photo-1546094096-0df4bcaaa337'), 'Bidco'],
    ['Breakfast Cereal Family Pack', 890, 1050, u('photo-1527960471264-932f39eb5846'), 'Unga'],
    ['Extra Virgin Olive Oil 750ml', 1450, 1700, u('photo-1474979266404-7eaacbcd87c5'), 'Bidco'],
    ['Pasta Variety Pack', 780, 950, u('photo-1551892374-ecf8754cf8b0'), 'Unga'],
    ['Sugar 2kg Pack', 420, 500, u('photo-1499195333224-3ce974eecb47'), 'Menengai'],
    ['Maize Flour 2kg', 280, 350, u('photo-1574323347407-f5e1ad6d020b'), 'Unga'],
    ['UHT Milk 1L 6-Pack', 890, 1050, u('photo-1550583724-b2692b85b150'), 'Brookside'],
    ['Wheat Flour 2kg', 320, 400, u('photo-1627485937980-221c88ac04f9'), 'Pembe'],
  ],
  cat_household: [
    ['Toilet Paper 24 Rolls', 1100, 1300, u('photo-1583947581924-860bda6a26df'), 'Always'],
    ['Facial Tissues Box (6)', 480, 600, u('photo-1583947215259-38e31be8751f'), 'Always'],
    ['Kitchen Towel Roll Pack', 650, 780, u('photo-1556911220-bff31c812dba'), 'Sunlight'],
    ['Air Freshener Spray 300ml', 420, 550, u('photo-1527515637462-5574983ecb47'), 'Air Wick'],
    ['Toilet Air Freshener Block', 280, 350, u('photo-1600566753190-17f0baa2a6c3'), 'Air Wick'],
    ['Laundry Detergent 3L', 980, 1200, u('photo-1610557892470-55d9e80c0bce'), 'Ariel'],
    ['Dishwashing Liquid Twin', 480, 600, u('photo-1563453392212-326f5e854473'), 'Sunlight'],
    ['Hand Soap Liquid 500ml', 350, 450, u('photo-1600857544200-b2f666a9a2ec'), 'Dettol'],
    ['All-Purpose Cleaner 1L', 520, 650, u('photo-1581578731548-c64695cc6952'), 'Dettol'],
    ['Bar Soap Multipack', 390, 480, u('photo-1612817288484-6f916006741a'), 'Bidco'],
  ],
  cat_appliances: [
    ['Non-Stick Cookware Set (5pc)', 6800, 7900, u('photo-1556909114-f6e7ad7d3136')],
    ['Electric Kettle 1.7L', 3200, 3900, u('photo-1544787219-7f47ccb76574')],
    ['Blender Smoothie Maker', 4500, 5400, u('photo-1570222094114-d054a817e56b')],
    ['Toaster 2-Slice Stainless', 2800, 3400, u('photo-1509440159596-0249088772ff')],
    ['Vacuum Flask 1L Stainless', 1800, 2200, u('photo-1602143407151-7111542de6e8')],
    ['Kitchen Knife Set with Block', 3900, 4600, u('photo-1593618998160-e34014e67546')],
    ['Hand Mixer Electric', 3500, 4200, u('photo-1577968897966-3d4325b36b61')],
    ['Steam Iron Ceramic', 4100, 4900, u('photo-1495364141860-b0d03eccd065')],
    ['Air Fryer Compact 3.5L', 8900, 10500, u('photo-1556910103-1c02745aae4d')],
    ['Rice Cooker 1.8L', 5200, 6100, u('photo-1585515320310-3affbf425d59')],
    ['Double Door Fridge 220L', 42500, 48900, u('photo-1571175443880-49e1d25b6bc3'), 'Ramtons'],
    ['Mini Fridge 90L', 18900, 22500, u('photo-1556912173-46c336c7fd55'), 'Hisense'],
    ['Chest Freezer 200L', 35900, 41900, u('photo-1484154218962-a197022b5858'), 'Hotpoint'],
  ],
  cat_tv: [
    ['Samsung 43" Crystal UHD Smart TV', 38500, 44900, u('photo-1593359677879-a4bb92f829d1'), 'Samsung'],
    ['Hisense 50" 4K Android TV', 42900, 49900, u('photo-1461151304267-38535e780c79'), 'Hisense'],
    ['LG 55" 4K Smart TV', 62900, 71900, u('photo-1593784991095-a205069470cd'), 'LG'],
    ['TCL 32" HD Android TV', 18900, 22500, u('photo-1577976540393-8c8350c5c2a2'), 'TCL'],
    ['LG 2.1 Channel Soundbar', 18900, 22500, u('photo-1545454675-3538b41d6eae'), 'LG'],
    ['Sony WH Wireless Headphones', 12500, 14900, u('photo-1505740420928-5e560c06d30e'), 'Sony'],
    ['Samsung Soundbar 3.1', 24900, 28900, u('photo-1618366712010-fb9e803efd47'), 'Samsung'],
    ['Vitron 43" Smart LED TV', 24500, 28900, u('photo-1574375927938-d5a342da2ba6'), 'Vitron'],
  ],
  cat_gaming: [
    ['Wireless Gaming Controller', 4500, 5400, u('photo-1606144042614-b2417e99c4e3')],
    ['Gaming Headset Surround', 5200, 6200, u('photo-1599669454699-248893623440')],
    ['RGB Mouse Pad XL', 1800, 2200, u('photo-1616587894289-86480e533129')],
    ['Mechanical Gaming Keyboard', 7800, 9200, u('photo-1595225476474-87563907a212')],
    ['Gaming Mouse RGB', 3200, 3900, u('photo-1527814050087-3793815479db')],
    ['Controller Charging Dock', 2400, 2900, u('photo-1612287230202-1ff1d85d1bdf')],
    ['VR Controllers Grip Covers', 1200, 1500, u('photo-1622979135225-d2ba269cf1ac')],
    ['Gaming Chair Cushion Set', 3500, 4200, u('photo-1598550476439-6847785fcea6')],
    ['Console Stand Vertical', 2100, 2600, u('photo-1606813907291-d86efa9b94db')],
    ['Esports Mouse Bungee', 950, 1200, u('photo-1555617730-48ba9c08ecb0')],
  ],
  cat_jewelry: [
    ['Classic Analog Watch', 4500, 5500, u('photo-1547996160-81dfa63595aa')],
    ['Silver Chain Necklace', 2800, 3400, u('photo-1515562141207-7a88fb7ce338')],
    ['Statement Earrings Set', 950, 1200, u('photo-1535632066927-ab7c9ab60908')],
    ['Leather Strap Watch', 3200, 3900, u('photo-1524592094714-0f0654e20314')],
    ['Gold-Plated Bracelet', 2100, 2600, u('photo-1611591437281-460bfbe1220a')],
    ['Couple Rings Set', 1800, 2200, u('photo-1605100804763-247f67b3557e')],
    ['Pearl Stud Earrings', 1450, 1800, u('photo-1599643478518-a784e5dc4c8f')],
    ['Sports Digital Watch', 2500, 3000, u('photo-1523275335684-37898b6baf30')],
    ['Charm Bracelet Adjustable', 1650, 2000, u('photo-1573408301185-9146fe634ad0')],
    ['Watch Box Organizer', 2200, null, u('photo-1614164185128-e4ec99c436d7')],
  ],
  cat_books: [
    ['A4 Notebook Pack (5)', 850, 1000, u('photo-1517842645767-c639042777db')],
    ['Ballpoint Pen Box (50)', 650, 800, u('photo-1455390582262-044cdead277a')],
    ['Document File Folders (12)', 980, 1200, u('photo-1481627834876-b7833e8f5570')],
    ['Bestseller Fiction Hardcover', 1800, 2200, u('photo-1544947950-fa07a98d237f')],
    ['Children Picture Book Set', 1450, 1800, u('photo-1512820790803-83ca734da794')],
    ['Planner 2026 Leather Cover', 2100, 2500, u('photo-1434030216411-0b793f4b4173')],
    ['Sticky Notes Assorted Pack', 450, 600, u('photo-1452860606245-08befc0ff44b')],
    ['Highlighter Set (8)', 580, 750, u('photo-1513542789411-b6a5d4f31634')],
    ['Business Strategy Paperback', 1650, 1900, u('photo-1495446815901-a7297e633e8d')],
    ['Stapler & Punch Set', 1200, 1450, u('photo-1586282391129-76a6df230234')],
  ],
  cat_toys: [
    ['Building Blocks Set 120pcs', 2800, 3400, u('photo-1587654780291-39c9404d746b')],
    ['Remote Control Car', 3500, 4200, u('photo-1566576912321-d58ddd7a6088')],
    ['Board Game Family Pack', 2400, 2900, u('photo-1611371805429-8b5c1b2c34ba')],
    ['Plush Soft Toy Bunny', 1200, null, u('photo-1559454403-b8fb88521f11')],
    ['Puzzle 1000 Pieces', 1650, 2000, u('photo-1516981879613-9f5da904015f')],
    ['Educational STEM Kit', 4200, 5000, u('photo-1581091226825-a6a2a5aee158')],
    ['Doll House Furniture Set', 3100, 3800, u('photo-1555252333-9f8e92e65df9')],
    ['Outdoor Bubble Machine', 1800, 2200, u('photo-1530103862676-de8c9debad1d')],
    ['Card Games Collection', 950, 1200, u('photo-1606326608606-aa0b62935f2b')],
    ['Action Figure Pack (3)', 2100, 2600, u('photo-1558060370-d30021e6e61e')],
  ],
  cat_sports: [
    ['Yoga Mat Non-Slip', 2100, 2600, u('photo-1601925260368-ae2f83cf8b7f')],
    ['Dumbbell Set 10kg Pair', 4500, 5400, u('photo-1517836357463-d25dfeac3438')],
    ['Football Size 5 Official', 1800, 2200, u('photo-1614632537190-23e4146777db')],
    ['Resistance Bands Set', 1450, 1800, u('photo-1434682881908-b43d0467b798')],
    ['Running Water Bottle 1L', 850, 1100, u('photo-1523362628245-2dc588023733')],
    ['Skipping Rope Speed', 650, 850, u('photo-1571019613454-1cb2f99b2d8b')],
    ['Camping Foldable Chair', 3200, 3900, u('photo-1504280390367-361c6d9f38f4')],
    ['Hiking Daypack 25L', 4800, 5600, u('photo-1553062407-98eeb64c6a62')],
    ['Tennis Ball Can (3)', 780, 950, u('photo-1622163642998-1ea32b0bbc67')],
    ['Fitness Tracker Band', 2890, 3500, u('photo-1575311373937-040b8e1fd5b6')],
  ],
  cat_fashion: [
    ['Classic Canvas Tote Bag', 1500, 1800, u('photo-1590874103328-eac38a683ce7')],
    ["Men's Casual Oxford Shirt", 2490, 2990, u('photo-1596755094514-f87e34085b2c')],
    ["Women's Linen Summer Dress", 3200, 3800, u('photo-1595777457583-95e059d581b8')],
    ['Unisex Running Sneakers', 4500, 5200, u('photo-1542291026-7eec264c27ff')],
    ['Leather Crossbody Bag', 3800, null, u('photo-1548036328-c9fa89d128fa')],
    ['Denim Jacket Classic Blue', 4200, 4900, u('photo-1576995853123-5a10305d93c0')],
    ['Sports Joggers Pair', 2100, 2500, u('photo-1552902865-b72c031ac5ea')],
    ['Sunglasses UV400', 1800, 2200, u('photo-1572635196237-14b3f281503f')],
    ['Ankle Boots Suede', 5600, 6500, u('photo-1543163521-1bf539c55dd2')],
    ['Cotton Polo Pack (3)', 2900, 3400, u('photo-1586790170083-2f9ceadc732d')],
  ],
  cat_baby: [
    ['Soft Cotton Onesie Pack (3)', 1800, 2200, u('photo-1522771930-78848d9293e8')],
    ['Baby Carrier Ergonomic', 4500, 5200, u('photo-1515488042361-ee00e0ddd4e4')],
    ['Silicone Feeding Set', 1650, 1900, u('photo-1519689680058-324335c77eba')],
    ['Organic Baby Wipes (12 packs)', 2100, 2500, u('photo-1544367567-0f2fcb009e0b')],
    ['Diaper Bag Multi-Pocket', 3400, 3900, u('photo-1588072432836-e10032774350')],
    ['Teething Relief Toy Set', 890, 1100, u('photo-1600880292205-02819b0add2d')],
    ['Baby Hooded Towel', 1400, 1700, u('photo-1503454537195-1dcabb73ffb9')],
    ['Night Light Soft Glow', 1550, 1900, u('photo-1513506003901-1e6a229e2d15')],
    ['Kids Backpack School', 2200, 2700, u('photo-1582582494705-125a3b48c4cb')],
    ['Baby Monitor Audio', 3800, 4500, u('photo-1558002038-1055907df827')],
  ],
  cat_auto: [
    ['Car Phone Mount Magnetic', 1450, 1800, u('photo-1605559424843-9e4c228bf1c2'), '3M'],
    ['Dash Cam 1080p Front', 6500, 7900, u('photo-1449965408869-eaa3f722e40d'), 'Bosch'],
    ['Motor Oil 5W-30 4L', 3200, 3800, u('photo-1486262715619-517d4b27e0df'), 'Castrol'],
    ['Car Floor Mats Set (4)', 2800, 3400, u('photo-1486006920555-c9dbe0d9b6f6'), 'Toyota'],
    ['Portable Tyre Inflator', 3900, 4500, u('photo-1615906653681-cf16ad72d7dd'), 'Bosch'],
    ['Jump Starter Power Bank', 7800, 9200, u('photo-1593941707882-a5bba14938c7'), 'Mobil'],
    ['Steering Wheel Cover Leather', 1650, 2000, u('photo-1502877338535-766e1452684a'), '3M'],
    ['Car Vacuum Cleaner 12V', 2400, 2900, u('photo-1558317374-067fb5f30049'), 'Bosch'],
  ],
  cat_pets: [
    ['Dry Dog Food 8kg', 3200, 3800, u('photo-1589924691995-400dc9ecc119'), 'Pedigree'],
    ['Cat Litter Clumping 10L', 1450, 1800, u('photo-1574158622682-e40e69881006'), 'Whiskas'],
    ['Orthopedic Pet Bed', 3500, 4200, u('photo-1548199973-03cce0bbc87b'), 'Kong'],
    ['Retractable Dog Leash', 980, 1200, u('photo-1548681528-6a5c45b66b42'), 'Kong'],
    ['Stainless Pet Bowl Pair', 750, 900, u('photo-1583337130417-3346a1be7dee'), 'Local Pet'],
    ['Cat Scratching Post', 2100, 2600, u('photo-1514888286974-6c03e2ca1dba'), 'Whiskas'],
    ['Pet Grooming Brush', 650, 800, u('photo-1601758228041-f3b608300060'), 'Seresto'],
    ['Puppy Chew Toy Set', 890, 1100, u('photo-1535295972055-1c762f4483e5'), 'Kong'],
  ],
  cat_garden: [
    ['Garden Hand Tool Set', 1800, 2200, u('photo-1416879595882-3373a0480b5b'), 'Fiskars'],
    ['Watering Can 8L', 950, 1200, u('photo-1466692476866-aef1dfb1e735'), 'Gardena'],
    ['Potting Mix 20L', 780, 950, u('photo-1416879595882-3373a0480b5b'), 'Miracle-Gro'],
    ['Pruning Shears Bypass', 1450, 1800, u('photo-1591857177580-dc82b9ac4e1e'), 'Fiskars'],
    ['Outdoor String Lights 10m', 1650, 2000, u('photo-1513475382585-d06e58bcb0e0'), 'Local Garden'],
    ['Cordless Drill 18V', 8900, 10500, u('photo-1504148455328-c376907d081c'), 'Bosch'],
    ['Plant Pot Terracotta Set', 1200, 1500, u('photo-1501004318641-b43a54634170'), 'Local Garden'],
    ['Lawn Seed Mix 1kg', 890, 1100, u('photo-1558904541-efa843a96f01'), 'Miracle-Gro'],
  ],
  cat_music: [
    ['Acoustic Guitar Folk', 12500, 14900, u('photo-1510915361894-db8b60106cb1'), 'Fender'],
    ['Yamaha Portable Keyboard', 18900, 22500, u('photo-1520523832277-79f135058b20'), 'Yamaha'],
    ['Studio Headphones Closed', 6500, 7800, u('photo-1484704849700-f032a568e944'), 'Audio-Technica'],
    ['Ukulele Soprano Starter', 4200, 5000, u('photo-1525201548942-6e14c8fe3c4a'), 'Donner'],
    ['Digital Piano 88-Key', 45000, 52000, u('photo-1520523832277-79f135058b20'), 'Casio'],
    ['USB Audio Interface', 8900, 10500, u('photo-1598488035139-bdbb2231ce04'), 'Audio-Technica'],
    ['Guitar Capo & Picks Pack', 850, 1100, u('photo-1564186763535-ebb21ef5277f'), 'Fender'],
    ['Bluetooth Karaoke Mic', 2400, 2900, u('photo-1516280443423-1c6413f7c181'), 'Donner'],
  ],
  cat_power: [
    ['Sun King Home 120 Solar Kit', 12500, 14900, u('photo-1509391366360-2e959784a276'), 'Sun King'],
    ['d.light Solar Lantern Twin', 3200, 3900, u('photo-1497435334941-8c899ee9e8e9'), 'd.light'],
    ['Jinko 550W Solar Panel', 18500, 21000, u('photo-1509391366360-2e959784a276'), 'Jinko'],
    ['Victron 12V 100Ah Battery', 24500, 27900, u('photo-1620714223084-8fcacc6dfd8b'), 'Victron'],
    ['Sollatek 1.2kVA Inverter', 28900, 32500, u('photo-1473341304170-971dccb5ac1e'), 'Sollatek'],
    ['Mustek 650VA UPS', 7800, 9200, u('photo-1513828583688-c52646db42da'), 'Mustek'],
    ['Solar Charge Controller 40A', 6500, 7800, u('photo-1621905252507-b35492cc74b4'), 'Victron'],
    ['Extension Reel 30m Heavy Duty', 2450, 2900, u('photo-1558618047-f4b511aee64e'), 'Sollatek'],
  ],
  cat_furniture: [
    ['3-Seater Fabric Sofa Grey', 42000, 48000, u('photo-1555041469-a586c61ea9bc'), 'Ashley'],
    ['Oak Dining Table 6-Seater', 28500, 33000, u('photo-1617806118233-18e1de3d13d0'), 'Woodmarc'],
    ['Queen Bed Frame Upholstered', 24500, 28900, u('photo-1505693416388-ac5ce068fe85'), 'Victoria'],
    ['Office Desk 120cm', 8900, 10500, u('photo-1518455027359-f3f8164ba6bd'), 'Meko'],
    ['Wardrobe 3-Door White', 18900, 22500, u('photo-1595428774223-ef52624120d2'), 'IKEA'],
    ['Coffee Table Round Oak', 6500, 7800, u('photo-1532372320572-cda25653a26d'), 'Woodmarc'],
    ['Bar Stool Pair Black', 4200, 5000, u('photo-1503602642458-232111445657'), 'Meko'],
    ['Bookshelf 5-Tier Pine', 5400, 6500, u('photo-1594620302200-9a762810a1e5'), 'Local Craft'],
  ],
  cat_wine: [
    ['Robertson Chenin Blanc 750ml', 1450, 1700, u('photo-1510812431401-41d2bd2722f3'), 'Robertson'],
    ['Four Cousins Sweet Red 1.5L', 1250, 1500, u('photo-1474722884775-271badadc41f'), 'Four Cousins'],
    ['KWV 3 Year Brandy 750ml', 1850, 2200, u('photo-1569529465841-dfecdab96605'), 'KWV'],
    ['Tusker Lager Case 24', 2400, 2800, u('photo-1608270586620-248524c67de9'), 'Tusker'],
    ['Guinness Foreign Extra 6-Pack', 980, 1200, u('photo-1571615114624-16219149f92c'), 'Guinness'],
    ['Smirnoff Vodka 750ml', 1650, 1950, u('photo-1514362545857-3bc16c4c7d1b'), 'Smirnoff'],
    ['Sparkling Wine Brut 750ml', 1890, 2300, u('photo-1551538827-9c037cb4f32a'), 'Robertson'],
    ['Whisky Blend 750ml', 2450, 2900, u('photo-1527281400683-1aae777175f8'), 'KWV'],
  ],
  cat_pharmacy: [
    ['Panadol Extra 24 Tablets', 320, 380, u('photo-1471864190281-a93a3070b6de'), 'Panadol'],
    ['Betadine Antiseptic 125ml', 450, 550, u('photo-1587854692152-cbe660dbde88'), 'Betadine'],
    ['Dettol Hand Sanitiser 500ml', 380, 450, u('photo-1585435557343-3b092031a831'), 'Dettol'],
    ['Always Ultra Pack 16', 290, 350, u('photo-1631549916768-4119b2e5f926'), 'Always'],
    ['Oral-B Toothbrush Twin', 420, 520, u('photo-1607613009820-a29f7bb81c04'), 'Oral-B'],
    ["Johnson's Baby Lotion 500ml", 580, 720, u('photo-1556228720-195a672e8a03'), "Johnson & Johnson"],
    ['First Aid Kit Home', 1450, 1750, u('photo-1603398938378-e54eab446dde'), 'Betadine'],
    ['Digital Thermometer', 650, 800, u('photo-1576091160399-112ba8d25d1d'), 'Panadol'],
  ],
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const vendorByCat = {
  cat_phones: 'usr_vendor2',
  cat_food: 'usr_vendor6',
  cat_computers: 'usr_vendor2',
  cat_beauty: 'usr_vendor1',
  cat_home: 'usr_vendor4',
  cat_groceries: 'usr_vendor6',
  cat_household: 'usr_vendor6',
  cat_appliances: 'usr_vendor4',
  cat_tv: 'usr_vendor2',
  cat_gaming: 'usr_vendor2',
  cat_jewelry: 'usr_vendor3',
  cat_books: 'usr_vendor4',
  cat_toys: 'usr_vendor3',
  cat_sports: 'usr_vendor2',
  cat_fashion: 'usr_vendor3',
  cat_baby: 'usr_vendor4',
  cat_auto: 'usr_vendor2',
  cat_pets: 'usr_vendor1',
  cat_garden: 'usr_vendor4',
  cat_music: 'usr_vendor3',
  cat_power: 'usr_vendor2',
  cat_furniture: 'usr_vendor4',
  cat_wine: 'usr_vendor6',
  cat_pharmacy: 'usr_vendor1',
};

const products = [];
let i = 0;
for (const [catId, items] of Object.entries(catalog)) {
  const catBrands = brandsByCat[catId] || ['BigDrop'];
  items.forEach((row, idx) => {
    const [name, price, compareAt, image, explicitBrand] = row;
    i += 1;
    const brand = explicitBrand || catBrands[idx % catBrands.length];
    const rating = Number((3.9 + (i % 10) * 0.1).toFixed(1));
    const reviewCount = 15 + ((i * 11) % 180);
    const reviewList = makeReviews(i, Math.min(8, Math.max(3, Math.floor(reviewCount / 25))), rating);
    // Use curated Unsplash images that match each product name/type
    const primaryImage =
      image ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
    const uniqueImages = [
      primaryImage,
      primaryImage.replace('w=800', 'w=1200'),
      primaryImage.replace('fit=crop', 'fit=crop&crop=center'),
    ].filter((url, idx, arr) => arr.indexOf(url) === idx);
    const sku = `BD-${catId.replace('cat_', '').slice(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
    const catName = categories.find((c) => c.id === catId)?.name || 'General';
    products.push({
      id: `prd_${i}`,
      vendorId: vendorByCat[catId],
      categoryId: catId,
      name,
      slug: `${slugify(name)}-${i}`,
      description: `${name} by ${brand} — available on BigDrop Kenya. Genuine product, fulfilled by Globeflight with nationwide delivery.`,
      specifications: [
        { name: 'Brand', value: brand },
        { name: 'Category', value: catName },
        { name: 'SKU', value: sku },
        { name: 'Condition', value: 'New' },
      ],
      variants:
        catId === 'cat_fashion'
          ? [
              { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
              { name: 'Colour', options: ['Black', 'White', 'Navy'] },
            ]
          : catId === 'cat_wine'
            ? [{ name: 'Pack', options: ['Single bottle', 'Case of 6'] }]
            : catId === 'cat_groceries' || catId === 'cat_household' || catId === 'cat_pharmacy'
              ? [{ name: 'Pack size', options: ['Single', '3-pack', '6-pack'] }]
              : catId === 'cat_furniture'
                ? [{ name: 'Colour', options: ['Oak', 'Walnut', 'White'] }]
                : catId === 'cat_power'
                  ? [{ name: 'Warranty', options: ['12 months', '24 months'] }]
                  : [],
      brand,
      price,
      compareAt,
      stock: 20 + ((i * 7) % 80),
      sku,
      images: uniqueImages,
      featured: idx < 2,
      rating,
      reviews: reviewCount,
      reviewList,
      questions: [
        {
          id: `qseed_${i}_1`,
          question: 'How long does delivery take in Nairobi?',
          asker: 'Shopper',
          answer: 'Most Nairobi orders arrive within 12 hours via Globeflight after confirmation.',
          answeredBy: 'BigDrop Support',
          createdAt: now,
          answeredAt: now,
        },
      ],
      tags: [categories.find((c) => c.id === catId)?.slug || 'deal', brand.toLowerCase()],
      status: 'approved',
      createdAt: now,
      soldCount: 40 + ((i * 13) % 500),
    });
  });
}

products.push({
  id: 'prd_pending_1',
  vendorId: 'usr_vendor3',
  categoryId: 'cat_fashion',
  name: 'Limited Edition Ankara Wrap Dress',
  slug: 'limited-edition-ankara-wrap-dress',
  description: 'Handcrafted Ankara wrap dress — awaiting BigDrop admin approval.',
  brand: 'Local Designers',
  price: 4800,
  compareAt: 5500,
  stock: 15,
  sku: 'BD-FAS-PEND1',
  images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'],
  featured: false,
  rating: 0,
  reviews: 0,
  reviewList: [],
  tags: ['fashion'],
  variants: [
    { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
    { name: 'Colour', options: ['Black', 'White', 'Navy'] },
  ],
  status: 'pending',
  createdAt: now,
  soldCount: 0,
});

function applyWooCatalogue() {
  const wooCataloguePath = path.join(dataDir, 'woo-catalogue.json');
  if (!fs.existsSync(wooCataloguePath)) return false;
  const woo = JSON.parse(fs.readFileSync(wooCataloguePath, 'utf8'));
  if (!Array.isArray(woo.products) || !woo.products.length) return false;
  const byId = new Map(categories.map((c) => [c.id, c]));
  for (const c of woo.categories || []) {
    if (byId.has(c.id)) Object.assign(byId.get(c.id), c);
    else {
      categories.push(c);
      byId.set(c.id, c);
    }
  }
  products.length = 0;
  products.push(...woo.products);
  console.log(`Using WooCommerce catalogue: ${products.length} products`);
  return true;
}

const usedWooCatalogue = applyWooCatalogue();

const vendors = [
  { id: 'usr_vendor1', name: 'Grace Njeri', email: 'beauty@bigdrop.co.ke', storeName: 'Nairobi Beauty Co.', phone: '+254712345001', status: 'approved' },
  { id: 'usr_vendor2', name: 'Kevin Otieno', email: 'gadgets@bigdrop.co.ke', storeName: 'TechHub KE', phone: '+254712345002', status: 'approved' },
  { id: 'usr_vendor3', name: 'Enagol Ame', email: 'fashion@bigdrop.co.ke', storeName: 'Style Avenue', phone: '+254712345003', status: 'approved' },
  { id: 'usr_vendor4', name: 'John Mwangi', email: 'home@bigdrop.co.ke', storeName: 'HomeNest Supplies', phone: '+254712345004', status: 'approved' },
  { id: 'usr_vendor5', name: 'Sarah Wanjiru', email: 'pending@bigdrop.co.ke', storeName: 'Safari Snacks Ltd', phone: '+254712345005', status: 'pending' },
  { id: 'usr_vendor6', name: 'Priya Shah', email: 'chandaria@bigdrop.co.ke', storeName: 'Chandaria Supermarket', phone: '+254712345006', status: 'approved' },
];

const db = {
  users: [
    { id: 'usr_admin', name: 'BigDrop Admin', email: 'info@bigdrop.co.ke', password: hash, role: 'admin', phone: '+254722359298', status: 'approved', createdAt: now },
    ...vendors.map((v) => ({
      id: v.id, name: v.name, email: v.email, password: hash, role: 'vendor',
      phone: v.phone, storeName: v.storeName, status: v.status, createdAt: now,
      hours: defaultVendorHours(), cart: [],
    })),
    { id: 'usr_customer1', name: 'Amina Wanjiku', email: 'customer@bigdrop.co.ke', password: hash, role: 'customer', phone: '+254700111222', status: 'approved', wishlist: [], cart: [], createdAt: now },
  ],
  categories,
  products,
  jobs: [
    {
      id: 'job_1',
      title: 'Warehouse Operations Associate',
      location: 'NextGen Mall, Nairobi',
      type: 'Full-time',
      summary: 'Support pick, pack, and dispatch operations at our Globeflight-powered fulfillment hub.',
      description:
        'You will pick and pack orders, zone parcels for Globeflight riders, and keep warehouse bays accurate. The role suits someone who enjoys physical work, checklists, and a busy Nairobi hub. Training is provided on our WMS, safety, and packing standards.\n\nTypical day: receive pick lists, locate SKUs, pack to quality rules, and hand over to dispatch. You will also help with cycle counts and low-stock flags.\n\nWe look for reliability, basic computer literacy, and a customer-first attitude. Night and weekend rotations may apply.',
      active: true,
    },
    {
      id: 'job_2',
      title: 'Vendor Success Manager',
      location: 'Nairobi (hybrid)',
      type: 'Full-time',
      summary: 'Onboard and support marketplace vendors — from first listing to sustained sales growth.',
      description:
        'Own the vendor journey from application to first live SKUs. You will train sellers on the dashboard, listing quality, stock alerts, and payouts, and escalate issues with operations.\n\nYou will run onboarding calls, review listing photos and descriptions, and help vendors grow through promotions and category advice.\n\nIdeal background: account management, retail, or marketplace ops in Kenya. Clear written English and comfort with CRM tools required.',
      active: true,
    },
    {
      id: 'job_3',
      title: 'Customer Support Specialist',
      location: 'Remote / Nairobi',
      type: 'Full-time',
      summary: 'Help shoppers and vendors with orders, tracking, and account questions — 24/7 rotation.',
      description:
        'Answer shopper and vendor questions on orders, tracking, returns, and accounts across email, chat, and phone. You will update tickets, coordinate with Globeflight on delays, and keep a calm, accurate tone.\n\nShifts cover evenings and weekends. We measure first-response time, resolution quality, and CSAT.\n\nApply if you have contact-centre experience, excellent Kiswahili and English, and enjoy solving delivery puzzles.',
      active: true,
    },
  ],
  orders: [],
  blogPosts: [
    {
      id: 'blog_1', slug: 'ecommerce-fulfillment-kenya',
      title: 'BigDrop Kenya: Smart E-commerce Fulfillment',
      excerpt: 'Warehousing, pick & pack, and nationwide delivery powered by Globeflight.',
      metaDescription: 'BigDrop offers warehousing, pick and pack, and nationwide delivery in Kenya so you can focus on selling.',
      imageAlt: 'Warehouse shelves used for ecommerce fulfillment',
      content: 'Looking for reliable e-commerce fulfillment in Kenya? BigDrop offers secure warehousing, inventory management, pick and pack, and nationwide delivery.\n\n## Why sellers use BigDrop\n\n> Focus on selling — let BigDrop pick, pack, store and deliver.\n\nWe handle storage at NextGen Mall and last-mile through Globeflight. Read more on [Globeflight Kenya](https://www.globeflight.co.ke).',
      ctaLabel: 'Visit Globeflight Kenya',
      ctaUrl: 'https://www.globeflight.co.ke',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80',
      author: 'BigDrop Team', publishedAt: '2026-07-15T10:00:00.000Z', tags: ['fulfillment'],
      published: true,
    },
    {
      id: 'blog_2', slug: 'how-bigdrop-delivery-works',
      title: 'From Order to Doorstep: How BigDrop Delivery Works',
      excerpt: 'Our fulfillment process from purchase order to Globeflight rider confirmation.',
      metaDescription: 'See how BigDrop and Globeflight pick, pack, and deliver orders across Kenya — from checkout to your door.',
      imageAlt: 'Delivery van on a Nairobi road',
      content: 'Your client places an order. You hand it to Big Drop. We create a P.O, pick, pack, call, deliver, and update the system.\n\n### The steps\n\nOrder in, pick from the warehouse, pack, then a Globeflight rider takes it to the customer.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
      author: 'Operations', publishedAt: '2026-06-02T10:00:00.000Z', tags: ['delivery'],
      published: true,
    },
  ],
  testimonials: [
    { id: 't1', name: 'Amily Moalin', role: 'Customer', quote: 'Products are genuine, delivery was faster than expected, and the team kept me updated every step.' },
    { id: 't2', name: 'Brian Otieno', role: 'Customer', quote: 'Ordered from Nairobi CBD and my package arrived same day with Globeflight. BigDrop is my go-to shop now.' },
    { id: 't3', name: 'Faith Wanjiku', role: 'Customer', quote: 'I shop for my parents in Kisumu while I am abroad. Tracking and Pay Protection give me real peace of mind.' },
    { id: 't4', name: 'Enagol Ame', role: 'Vendor', quote: 'Partnering with BigDrop has been smooth and rewarding. Clear communication and professional fulfillment.' },
    { id: 't5', name: 'John Mwangi', role: 'Vendor', quote: 'Reliable warehousing and nationwide delivery — I focus on selling while Globeflight handles the rest.' },
  ],
  contactMessages: [],
  newsletter: [],
  notifications: [],
  coupons: DEFAULT_COUPONS,
  faqs: DEFAULT_FAQS,
  siteMetrics: { visits: 12840, checkoutsStarted: 486 },
  site: {
    name: 'BigDrop Kenya',
    tagline: 'Leading Online Shopping Store in Nairobi Kenya',
    phone: '+254 722 359 298',
    emails: ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke'],
    address: 'NextGen Mall, 3rd Floor, Suite 40, Nairobi, Kenya',
    lat: -1.32377,
    lng: 36.84366,
    hours: '24 Hours',
    freeDeliveryMin: 10000,
    deliveryFee: 280,
    commissionRate: 0.15,
    whatsapp: '254722359298',
    flashEndsAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    homeBlocks: { ...DEFAULT_HOME_BLOCKS },
    featuredCategorySlugs: FEATURED_CATEGORY_SLUGS,
    heroes: [
      {
        id: 'hero_1',
        title: 'Mega Deals Week',
        text: 'Up to 70% off on electronics, fashion & more',
        href: '/deals',
        cta: 'Shop Now',
        gradient: 'linear-gradient(to right, #f97316, #fbbf24)',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'hero_2',
        title: 'Nationwide delivery by Globeflight',
        text: 'Usually the same business day within Nairobi; 2–5 days elsewhere',
        href: '/shop',
        cta: 'Start Shopping',
        gradient: 'linear-gradient(to right, #0ea5e9, #60a5fa)',
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'hero_3',
        title: 'New Arrivals in Tech',
        text: 'Latest smartphones, laptops & gadgets',
        href: '/shop?category=phone-tablet',
        cta: 'Explore Tech',
        gradient: 'linear-gradient(to right, #059669, #34d399)',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'hero_4',
        title: 'Back to School Sale',
        text: 'Everything your child needs at great prices',
        href: '/deals',
        cta: 'View Deals',
        gradient: 'linear-gradient(to right, #7c3aed, #a78bfa)',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
      },
    ],
  },
};

// Demo orders for analytics + customer previous-order history
function buildDemoOrders(productList) {
  const pick = (n) => productList[n % productList.length];
  const samples = [
    { status: 'delivered', pay: 'mpesa', daysAgo: 12, idxs: [0, 3] },
    { status: 'delivered', pay: 'card', daysAgo: 9, idxs: [1] },
    { status: 'out_for_delivery', pay: 'mpesa', daysAgo: 2, idxs: [5, 8] },
    { status: 'packed', pay: 'cod', daysAgo: 1, idxs: [2] },
    { status: 'picking', pay: 'mpesa', daysAgo: 0, idxs: [4, 10] },
    { status: 'confirmed', pay: 'cod', daysAgo: 0, idxs: [7] },
    { status: 'delivered', pay: 'mpesa', daysAgo: 18, idxs: [11, 14] },
    { status: 'delivered', pay: 'cod', daysAgo: 6, idxs: [9] },
  ];
  const flow = ['placed', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered'];
  return samples.map((s, i) => {
    const created = new Date(Date.now() - s.daysAgo * 86400000 - i * 3600000).toISOString();
    const items = s.idxs.map((idx) => {
      const p = pick(idx + i * 2);
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        qty: 1 + (i % 2),
        vendorId: p.vendorId,
        image: p.images?.[0],
      };
    });
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = s.pay === 'cod' || subtotal < 10000 ? 280 : 0;
    const total = subtotal + shipping;
    const orderNumber = `BD${String(100000 + i).slice(1)}${nanoid(4).toUpperCase()}`;
    const trackingNumber = `GF${nanoid(9).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 9)}`;
    const statusIdx = flow.indexOf(s.status);
    const timeline = flow.slice(0, statusIdx + 1).map((st, step) => ({
      status: st,
      label: `${step + 1}. ${st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      step: step + 1,
      at: new Date(Date.parse(created) + step * 3600000).toISOString(),
    }));
    const invoice = {
      id: `inv_demo_${i}`,
      type: 'invoice',
      title: 'Tax Invoice / Order Invoice',
      orderNumber,
      issuedAt: created,
      to: { name: 'Amina Wanjiku', email: 'customer@bigdrop.co.ke', phone: '+254700111222' },
      items,
      subtotal,
      discount: 0,
      shipping,
      total,
      paymentMethod: s.pay,
      note: 'Thank you for shopping with BigDrop Kenya',
    };
    const docs = [invoice];
    if (s.status === 'delivered') {
      docs.push({
        id: `rcp_demo_${i}`,
        type: 'receipt',
        title: 'Delivery receipt',
        orderNumber,
        issuedAt: timeline[timeline.length - 1].at,
        to: invoice.to,
        items,
        shipping,
        total,
        note: 'Thank you for shopping with BigDrop Kenya',
      });
    }
    return {
      id: `ord_demo_${i}`,
      orderNumber,
      trackingNumber,
      customerId: 'usr_customer1',
      customerName: 'Amina Wanjiku',
      customerEmail: 'customer@bigdrop.co.ke',
      customerPhone: '+254700111222',
      items,
      subtotal,
      discount: 0,
      shipping,
      total,
      paymentMethod: s.pay,
      paymentStatus: s.pay === 'cod' ? 'pending' : 'paid',
      deliveryOption: 'delivery',
      status: s.status,
      shippingAddress: {
        line1: 'NextGen Mall Road',
        city: 'Nairobi',
        county: 'Nairobi',
        notes: '',
      },
      carrier: 'BigDrop Kenya',
      timeline,
      documents: docs,
      notifications: [],
      createdAt: created,
      updatedAt: timeline[timeline.length - 1].at,
    };
  });
}

db.orders = buildDemoOrders(products);

// Force a few low-stock SKUs for alert demos (sample catalogue only)
if (!usedWooCatalogue) {
  for (let i = 0; i < Math.min(6, products.length); i += 2) {
    products[i].stock = 2 + (i % 4);
  }
}

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const payload = JSON.stringify(db, null, 2);
fs.writeFileSync(dbPath, payload);
fs.writeFileSync(path.join(dataDir, 'seed.json'), payload);
console.log(`Seeded ${categories.length} categories, ${products.length} products, ${db.orders.length} demo orders`);
console.log(categories.map((c) => c.name).join(' | '));
