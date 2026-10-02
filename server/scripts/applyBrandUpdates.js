import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Backup db first
const backupPath = path.resolve(`server/data/backups/db-before-brand-update-${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Created backup at:', backupPath);

// Define precise brand matching rules
const rules = [
  // 1. Casio watch & casio calculators
  {
    brand: 'Casio',
    test: (p) => p.id === 'prd_102' || /\b(casio|g-shock|edifice|baby-g)\b/i.test(p.name) || (p.categoryId === 'cat_jewelry' && /\bwatch\b/i.test(p.name))
  },
  // 2. Apple: iPhones, iPads, MacBooks, AirPods, Apple chargers/accessories
  {
    brand: 'Apple',
    test: (p) => {
      const name = p.name;
      if (/juice|cider|glinter|amandla|green apple|freshener|cinamon|cinnamon|water based/i.test(name)) return false;
      if (/^Marshmallow\b/i.test(name)) return false;
      if (/^Awei\b/i.test(name)) return false;
      return /\b(iphone|apple\s+iphone|ipad|apple\s+ipad|macbook|apple\s+airpods|airpod\s+pro\s+apple)\b/i.test(name) || (name.startsWith('Apple ') && !/juice|glinter|amandla/i.test(name));
    }
  },
  // 3. Xiaomi: Xiaomi, Redmi, POCO
  {
    brand: 'Xiaomi',
    test: (p) => /\b(xiaomi|redmi|poco)\b/i.test(p.name)
  },
  // 4. Samsung: Samsung phones, TVs, chargers
  {
    brand: 'Samsung',
    test: (p) => {
      if (/^Marshmallow\b/i.test(p.name)) return false;
      return /\b(samsung|galaxy)\b/i.test(p.name);
    }
  },
  // 5. Nokia
  { brand: 'Nokia', test: (p) => /\bnokia\b/i.test(p.name) },
  // 6. Oppo
  { brand: 'Oppo', test: (p) => /\boppo\b/i.test(p.name) },
  // 7. Huawei
  { brand: 'Huawei', test: (p) => /\bhuawei\b/i.test(p.name) && !/^Marshmallow\b/i.test(p.name) },
  // 8. Tecno
  { brand: 'Tecno', test: (p) => /\btecno\b/i.test(p.name) },
  // 9. Infinix
  { brand: 'Infinix', test: (p) => /\binfinix\b/i.test(p.name) },
  // 10. HP, Dell, Lenovo, Canon, Logitech
  { brand: 'HP', test: (p) => /\b(hp\b|hewlett-packard)/i.test(p.name) },
  { brand: 'Dell', test: (p) => /\bdell\b/i.test(p.name) },
  { brand: 'Lenovo', test: (p) => /\b(lenovo|thinkpad|ideapad)\b/i.test(p.name) },
  { brand: 'Canon', test: (p) => /\bcanon\b/i.test(p.name) },
  { brand: 'Logitech', test: (p) => /\blogitech\b/i.test(p.name) },
  // 11. TVs / Appliances / Audio
  { brand: 'Hisense', test: (p) => /\bhisense\b/i.test(p.name) },
  { brand: 'TCL', test: (p) => /\btcl\b/i.test(p.name) },
  { brand: 'LG', test: (p) => /\blg\b/i.test(p.name) },
  { brand: 'Vitron', test: (p) => /\bvitron\b/i.test(p.name) },
  { brand: 'Syinix', test: (p) => /\bsyinix\b/i.test(p.name) },
  { brand: 'Silvercrest', test: (p) => /\bsilvercrest\b/i.test(p.name) },
  { brand: 'Nunix', test: (p) => /\bnunix\b/i.test(p.name) },
  { brand: 'Aiwa', test: (p) => /\baiwa\b/i.test(p.name) },
  { brand: 'Awei', test: (p) => /\bawei\b/i.test(p.name) },
  { brand: 'JBL', test: (p) => /\bjbl\b/i.test(p.name) },
  { brand: 'Ramtons', test: (p) => /\bramtons\b/i.test(p.name) },
  { brand: 'Hotpoint', test: (p) => /\b(hotpoint|von hotpoint)\b/i.test(p.name) },
  // 12. Household & Kenyan Brands
  { brand: 'Melvins', test: (p) => /\bmelvins\b/i.test(p.name) },
  { brand: 'Durapoa', test: (p) => /\bdurapoa\b/i.test(p.name) },
  { brand: 'Poshy', test: (p) => /\bposhy\b/i.test(p.name) },
  { brand: 'Nice & Soft', test: (p) => /\bnice & soft\b/i.test(p.name) },
  { brand: 'Dawn Pekee', test: (p) => /\bdawn pekee\b/i.test(p.name) },
  { brand: 'Bennetts', test: (p) => /\bbennetts\b/i.test(p.name) },
  { brand: 'Glinter', test: (p) => /\bglinter\b/i.test(p.name) },
  { brand: 'Amandla', test: (p) => /\bamandla\b/i.test(p.name) },
  { brand: 'Luminous', test: (p) => /\bluminous\b/i.test(p.name) },
  { brand: 'Bosch', test: (p) => /\bbosch\b/i.test(p.name) }
];

let updatedCount = 0;
const brandCounts = {};

db.products.forEach(p => {
  for (const r of rules) {
    if (r.test(p)) {
      if (p.brand !== r.brand) {
        p.brand = r.brand;
        // Keep specifications aligned if Brand row is present
        if (Array.isArray(p.specifications)) {
          const brandSpec = p.specifications.find(s => s && s.name && s.name.toLowerCase() === 'brand');
          if (brandSpec) {
            brandSpec.value = r.brand;
          }
        }
        brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1;
        updatedCount++;
      }
      break;
    }
  }
});

// Update category brand filter lists so newly assigned brands appear in faceted filters
const catBrandAdditions = {
  cat_jewelry: ['Casio'],
  cat_books: ['Casio'],
  cat_food: ['Melvins', 'Glinter', 'Amandla'],
  cat_power: ['Luminous'],
  cat_household: ['Durapoa', 'Poshy', 'Nice & Soft', 'Dawn Pekee'],
  cat_baby: ['Bennetts'],
  cat_appliances: ['Silvercrest', 'Nunix', 'Aiwa', 'Hotpoint'],
  cat_tv: ['Hisense', 'Vitron', 'Syinix', 'TCL'],
  cat_phones: ['Xiaomi', 'Apple', 'Samsung', 'Nokia', 'Oppo', 'Huawei', 'Awei'],
  cat_computers: ['HP', 'Dell', 'Lenovo']
};

db.categories.forEach(cat => {
  const additions = catBrandAdditions[cat.id];
  if (additions) {
    cat.brands = cat.brands || [];
    for (const b of additions) {
      if (!cat.brands.includes(b)) {
        cat.brands.push(b);
      }
    }
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log(`Successfully updated ${updatedCount} products!`);
console.log('Brand update summary:', brandCounts);
