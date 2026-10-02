// Generates 5 local avatar SVG files for the testimonial carousel fallback
// (replaces the i.pravatar.cc / ui-avatars.com external URLs — item 6).
import fs from 'fs';
import path from 'path';

const avatarsDir = path.join('client', 'public', 'avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

const testimonials = [
  { id: 'f1', name: 'Amily Moalin', role: 'Customer', initials: 'AM' },
  { id: 'f2', name: 'Grace Wanjiku', role: 'Customer', initials: 'GW' },
  { id: 'f3', name: 'Brian Otieno', role: 'Customer', initials: 'BO' },
  { id: 'f4', name: 'Enagol Ame', role: 'Vendor', initials: 'EA' },
  { id: 'f5', name: 'John Mwangi', role: 'Vendor', initials: 'JM' },
];

const GREEN = '#015837';

testimonials.forEach((t) => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">` +
    `<rect width="128" height="128" fill="${GREEN}"/>` +
    `<text x="64" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700"` +
    ` fill="#ffffff" text-anchor="middle">${t.initials}</text>` +
    `</svg>`;
  fs.writeFileSync(path.join(avatarsDir, `${t.id}.svg`), svg);
});

console.log(`Generated ${testimonials.length} avatar SVGs in ${avatarsDir}`);
console.log('Files:', fs.readdirSync(avatarsDir));
