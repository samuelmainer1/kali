import crypto from 'node:crypto';

const STAFF_ONLINE_MS = 45_000;
const presence = new Map();

const FACTS = `You are the Globeflight Kenya website assistant. You reply only while customer support is away. Answer basic questions about the company from the facts below. Use plain words.

Who we are:
- Globeflight Kenya is a logistics and freight forwarding company in Nairobi. The website also uses the name Globeflight Worldwide Express. It moves cargo for companies and individuals across Kenya, East Africa, and international routes.
- The website describes more than 25 years in logistics and membership of KGCHA, with a network across Africa.
- Vision: to be a leading independent logistics company for corporates, SMEs, and developing markets in Kenya and East Africa.
- Mission: precise, prompt, and affordable service, using current technology.
- Values: reliability, integrity, efficiency, innovation, and professionalism.
- Sister company: Union Green Logistics Ltd handles customs brokerage. Globeflight and Union Green also work together on regional road transport and distribution in East Africa.

Where to find us:
- Office: NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road, Nairobi.
- Warehouse and fulfillment center: Semco Business Park (also called SEMCO Industrial Park), Mombasa Road, Mlolongo. It is near Jomo Kenyatta International Airport and the Inland Container Depot.
- Published office hours, Nairobi time: Monday to Friday 8:00 to 17:00, Saturday 9:00 to 13:00.
- Customer service email: cs@globeflight.co.ke
- Quotes and inquiries: sam.maina@globeflight.co.ke. Use this address whenever someone asks for a quote, a price, a booking, or how to make an inquiry. Write the address in the reply.
- Phone and WhatsApp: +254 729 341 277
- You cannot quote a price or look up a shipment. For those, give sam.maina@globeflight.co.ke and the phone number.

What we do:
- Air freight: time-sensitive cargo, door-to-door or airport-to-airport, with tracking and customs support. Chargeable weight is the higher of the actual weight and the volumetric weight (length x width x height in centimetres, divided by 6000). Undeclared hazardous goods, explosives, lithium batteries without the required documents, and illegal goods are not accepted.
- Sea freight: bulky cargo through the Port of Mombasa, full container (FCL) and shared container (LCL), vehicles by RoRo, door-to-port or door-to-door, then inland trucking. A 20ft container is about 33 cubic metres and a 40ft container is about 67. The website gives a guide of about 25 to 35 days from China and about 10 to 15 days from Dubai or India. Say that a person confirms the sailing for that shipment. Demurrage is a port charge if a container stays after the free days.
- Customs clearance: help with Kenya Revenue Authority entries at JKIA, Mombasa Port, and the inland container depots. Usual papers are the bill of lading or air waybill, commercial invoice, packing list, Import Declaration Form, KEBS certificate of conformity, and KRA PIN. Do not calculate duty or tax. Union Green Logistics Ltd handles the brokerage.
- International express: door-to-door parcels and documents. The website says this reaches 220 or more countries and is aimed at smaller parcels, often under 30kg, and documents, with a guide of 1 to 4 days. The receiver may still pay local duty. A person confirms the service for that parcel.
- Consolidation: goods from several suppliers, often in China, are received and shipped onward as one air or sea shipment so the importer pays for one movement instead of many small ones.
- Warehousing and distribution: storage at the Mlolongo warehouse, from one pallet up to a larger space, pick and pack, cross-docking, short or long term, and last-mile distribution. The building has 24-hour security. Clients should insure the value of their own goods. Collection is in business hours unless arranged ahead.
- Big Drop Kenya: an online marketplace at bigdrop.co.ke and a fulfillment service. Globeflight can store a vendor's stock, then pick, pack, and deliver orders. A vendor can use fulfillment without listing on the marketplace. Sellers outside Kenya can use it too.
- Importer and exporter of record: Globeflight can act as the company legally responsible for an import or export, so a foreign business can move goods through African customs without opening its own local company. A person confirms whether a shipment qualifies.
- Road transport: regional delivery and distribution in East Africa, together with Union Green Logistics Ltd.
- Tracking: the visitor uses the Track page on this website and the tracking number. You cannot see shipment records.

How to answer:
- For "what do you do", name these services in a short list. For a quote, give sam.maina@globeflight.co.ke and the phone number.
- You may repeat a time range only when it is written above, and say customer support confirms the exact time.
- Do not invent prices, duty amounts, account numbers, fleet sizes, or a promise that cargo will arrive on a named date.
- If the question is not covered here, say customer support will confirm. For an inquiry or a quote, give sam.maina@globeflight.co.ke and the phone number.
- Keep the reply short and plain. No headings. Reply in the language the visitor used.`;

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function clip(value, limit) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function markStaffPresent(userId) {
  presence.set(String(userId), Date.now());
}

export function isStaffOnline() {
  const now = Date.now();
  for (const [id, seen] of presence) {
    if (now - seen > STAFF_ONLINE_MS) presence.delete(id);
  }
  return presence.size > 0;
}

function messagesFor(db, chatId) {
  return (db.chatMessages || [])
    .filter((item) => item.chatId === chatId)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id - b.id);
}

function publicMessage(message) {
  return {
    id: message.id,
    from: message.from,
    text: message.text,
    authorName: message.authorName,
    createdAt: message.createdAt,
  };
}

function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 120) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function validPhone(value) {
  const phone = String(value || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return '';
  return phone;
}

function publicThread(db, chat, token) {
  const messages = messagesFor(db, chat.id).slice(-80).map(publicMessage);
  const payload = {
    id: chat.id,
    visitorName: chat.visitorName || '',
    visitorEmail: chat.visitorEmail || '',
    visitorPhone: chat.visitorPhone || '',
    hasContact: Boolean(chat.visitorEmail && chat.visitorPhone),
    handler: isStaffOnline() ? 'staff' : 'ai',
    staffOnline: isStaffOnline(),
    messages,
  };
  if (token) payload.token = token;
  return payload;
}

function findByToken(db, token) {
  const value = String(token || '');
  if (value.length < 20) return null;
  return (db.chats || []).find((chat) => chat.token === value) || null;
}

export function readVisitorChat(db, token) {
  const chat = findByToken(db, token);
  if (!chat) return { staffOnline: isStaffOnline(), messages: [], handler: isStaffOnline() ? 'staff' : 'ai' };
  return publicThread(db, chat);
}

function cleanReply(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

async function groqReply(history) {
  const key = String(process.env.GROQ_API_KEY || '').trim();
  const fallback = 'Thanks for your message. Customer support is away right now. For a quote or inquiry, email sam.maina@globeflight.co.ke or call +254 729 341 277.';
  if (!key) return fallback;
  const messages = [
    { role: 'system', content: FACTS },
    ...history.map((message) => ({
      role: message.from === 'visitor' ? 'user' : 'assistant',
      content: message.from === 'staff' ? `Customer support said: ${message.text}` : message.text,
    })),
  ];
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages,
        temperature: 0.4,
        max_tokens: 400,
        reasoning_effort: 'low',
      }),
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Groq chat failed:', response.status, body.error?.message || '');
      return fallback;
    }
    const text = cleanReply(body.choices?.[0]?.message?.content);
    return text || fallback;
  } catch (error) {
    console.error('Groq chat failed:', error.message);
    return fallback;
  }
}

function saveChatContact(db, chat) {
  db.chatContacts ||= [];
  let row = db.chatContacts.find((item) => item.chatId === chat.id);
  const now = new Date().toISOString();
  if (!row) {
    row = {
      id: nextId(db.chatContacts),
      chatId: chat.id,
      createdAt: now,
    };
    db.chatContacts.unshift(row);
  }
  row.name = chat.visitorName || '';
  row.email = chat.visitorEmail;
  row.phone = chat.visitorPhone;
  row.updatedAt = now;
}

export function listChatContacts(db) {
  db.chatContacts ||= [];
  let changed = false;
  for (const chat of db.chats || []) {
    if (!chat.visitorEmail || !chat.visitorPhone) continue;
    if (db.chatContacts.some((row) => row.chatId === chat.id)) continue;
    saveChatContact(db, chat);
    changed = true;
  }
  const contacts = [...db.chatContacts].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return {
    changed,
    contacts: contacts.map((row) => ({
      id: row.id,
      chatId: row.chatId,
      name: row.name || '',
      email: row.email,
      phone: row.phone,
      createdAt: row.createdAt,
    })),
  };
}

export function startVisitorChat(db, { token, email, phone, name }) {
  const visitorEmail = validEmail(email);
  const visitorPhone = validPhone(phone);
  if (!visitorEmail) httpError(400, 'Enter a valid email address.');
  if (!visitorPhone) httpError(400, 'Enter a phone number.');
  db.chats ||= [];
  db.chatMessages ||= [];
  let chat = findByToken(db, token);
  let createdToken = null;
  const visitorName = clip(name, 60);
  const now = new Date().toISOString();
  let captured = false;
  if (!chat) {
    createdToken = crypto.randomBytes(32).toString('hex');
    chat = {
      id: nextId(db.chats),
      token: createdToken,
      visitorName,
      visitorEmail,
      visitorPhone,
      handler: 'ai',
      staffUnread: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.chats.push(chat);
    captured = true;
  } else if (!chat.visitorEmail || !chat.visitorPhone) {
    chat.visitorEmail = visitorEmail;
    chat.visitorPhone = visitorPhone;
    if (visitorName && !chat.visitorName) chat.visitorName = visitorName;
    chat.staffUnread = Math.max(Number(chat.staffUnread || 0), 1);
    chat.updatedAt = now;
    captured = true;
  }
  if (captured) saveChatContact(db, chat);
  return { thread: publicThread(db, chat, createdToken), captured, chat };
}

export async function postVisitorMessage(db, { token, text, name }, notify) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) httpError(400, 'Write a message first.');
  if (clean.length > 1000) httpError(400, 'That message is too long.');
  db.chats ||= [];
  db.chatMessages ||= [];
  const chat = findByToken(db, token);
  if (!chat || !chat.visitorEmail || !chat.visitorPhone) {
    httpError(400, 'Enter your email and phone number before chatting.');
  }
  const visitorName = clip(name, 60);
  if (visitorName && !chat.visitorName) chat.visitorName = visitorName;
  const now = new Date().toISOString();
  db.chatMessages.push({
    id: nextId(db.chatMessages),
    chatId: chat.id,
    from: 'visitor',
    text: clean,
    authorName: chat.visitorName || 'Visitor',
    createdAt: now,
  });
  const thread = messagesFor(db, chat.id);
  if (thread.length > 200) {
    const remove = new Set(thread.slice(0, thread.length - 200).map((item) => item.id));
    db.chatMessages = db.chatMessages.filter((item) => item.chatId !== chat.id || !remove.has(item.id));
  }
  chat.updatedAt = now;
  chat.staffUnread = Number(chat.staffUnread || 0) + 1;
  if (typeof notify === 'function') await notify(chat, clean);
  if (isStaffOnline()) {
    chat.handler = 'staff';
  } else {
    chat.handler = 'ai';
    const reply = await groqReply(messagesFor(db, chat.id).slice(-8));
    db.chatMessages.push({
      id: nextId(db.chatMessages),
      chatId: chat.id,
      from: 'ai',
      text: reply,
      authorName: 'Globeflight Assistant',
      createdAt: new Date().toISOString(),
    });
    chat.updatedAt = new Date().toISOString();
  }
  return publicThread(db, chat);
}

export function staffInbox(db) {
  const chats = [...(db.chats || [])].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 40);
  return {
    staffOnline: isStaffOnline(),
    chats: chats.map((chat) => {
      const messages = messagesFor(db, chat.id);
      const last = messages[messages.length - 1];
      return {
        id: chat.id,
        visitorName: chat.visitorName || 'Visitor',
        visitorEmail: chat.visitorEmail || '',
        visitorPhone: chat.visitorPhone || '',
        staffUnread: Number(chat.staffUnread || 0),
        updatedAt: chat.updatedAt,
        preview: last ? clip(last.text, 90) : '',
        lastFrom: last ? last.from : '',
      };
    }),
  };
}

export function staffThread(db, chatId) {
  const chat = (db.chats || []).find((item) => String(item.id) === String(chatId));
  if (!chat) httpError(404, 'Chat not found.');
  chat.staffUnread = 0;
  return {
    id: chat.id,
    visitorName: chat.visitorName || 'Visitor',
    visitorEmail: chat.visitorEmail || '',
    visitorPhone: chat.visitorPhone || '',
    staffOnline: isStaffOnline(),
    messages: messagesFor(db, chat.id).slice(-80).map(publicMessage),
  };
}

export function staffReply(db, chatId, user, text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) httpError(400, 'Write a reply first.');
  if (clean.length > 1000) httpError(400, 'That reply is too long.');
  const chat = (db.chats || []).find((item) => String(item.id) === String(chatId));
  if (!chat) httpError(404, 'Chat not found.');
  const now = new Date().toISOString();
  db.chatMessages ||= [];
  db.chatMessages.push({
    id: nextId(db.chatMessages),
    chatId: chat.id,
    from: 'staff',
    text: clean,
    authorName: clip(user.fullName, 60) || 'Customer support',
    createdAt: now,
  });
  chat.handler = 'staff';
  chat.staffUnread = 0;
  chat.updatedAt = now;
  markStaffPresent(user.id);
  return staffThread(db, chat.id);
}
