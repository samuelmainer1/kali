import crypto from 'node:crypto';

const STAFF_ONLINE_MS = 45_000;
const presence = new Map();

const FACTS = `You are the Globeflight Kenya website assistant. You reply only while customer support is away.

Use only these facts:
- Globeflight Kenya is a logistics company based in Nairobi.
- Office: NEXTGEN MALL, 3rd Floor, Suite 39/40, Mombasa Road, Nairobi.
- Warehouse: Semco Business Park, Mombasa Road, Mlolongo.
- Email: cs@globeflight.co.ke
- Phone and WhatsApp: +254 729 341 277
- Services: air freight, sea freight, customs clearance and brokerage, warehousing and distribution, international import and export express, consolidation, Big Drop Kenya e-commerce fulfillment, and importer and exporter of records.
- A visitor can track a shipment on the website Track page with the tracking number. You cannot look up a shipment yourself.
- Do not invent prices, transit times, duties, taxes, account numbers, or promises.
- If you do not know, say customer support will confirm, and give the email and phone.
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
  const fallback = 'Thanks for your message. Customer support is away right now. Email cs@globeflight.co.ke or call +254 729 341 277 and a person will help you.';
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
  notify(chat, clean);
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
