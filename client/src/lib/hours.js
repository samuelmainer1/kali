export function defaultVendorHours() {
  return {
    open24: false,
    mon: '08:00-20:00',
    tue: '08:00-20:00',
    wed: '08:00-20:00',
    thu: '08:00-20:00',
    fri: '08:00-20:00',
    sat: '08:00-20:00',
    sun: '09:00-18:00',
  };
}

export function vendorIsOpen(hours, now = new Date()) {
  if (!hours) return true;
  if (hours.open24) return true;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const day = days[now.getDay()];
  const spec = hours[day] || hours.default;
  if (!spec) return true;
  if (spec === 'closed') return false;
  const [start, end] = String(spec).split('-').map((s) => s.trim());
  if (!start || !end) return true;
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMin(start) && mins <= toMin(end);
}
