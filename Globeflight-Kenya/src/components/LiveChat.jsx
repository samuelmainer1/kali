import { useEffect, useRef, useState } from "react";
import supportPhoto from "../assets/support-agent.jpg";

const TOKEN_KEY = "gf-chat-token";

function when(iso) {
  const then = new Date(iso).getTime();
  if (!then) return "";
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [staffOnline, setStaffOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef(null);
  const openRef = useRef(false);
  const seenRef = useRef(0);
  const sessionRef = useRef(0);
  const [hasChat, setHasChat] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));
  openRef.current = open;

  function currentToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function stillThisChat(session, token) {
    return session === sessionRef.current && currentToken() === (token || "");
  }

  async function load() {
    const session = sessionRef.current;
    const token = currentToken();
    if (!token) return;
    try {
      const response = await fetch("/admin/api/chat", {
        headers: { "X-Chat-Token": token },
      });
      if (!stillThisChat(session, token)) return;
      if (response.status === 404) {
        localStorage.removeItem(TOKEN_KEY);
        setHasChat(false);
        return;
      }
      if (response.status === 429) return;
      if (!response.ok) return;
      const body = await response.json();
      const next = (body.data && body.data.messages) || [];
      setMessages(next);
      setReady(Boolean(body.data && body.data.hasContact));
      setStaffOnline(Boolean(body.data && body.data.staffOnline));
      const lastId = next.length ? next[next.length - 1].id : 0;
      if (!openRef.current && lastId > seenRef.current && next[next.length - 1].from !== "visitor") {
        setUnseen(true);
      }
      if (openRef.current) seenRef.current = lastId;
    } catch {
      /* Polling resumes on the next tick. */
    }
  }

  useEffect(() => {
    if (!hasChat) return undefined;
    load();
    const timer = setInterval(load, open ? 10000 : 30000);
    return () => clearInterval(timer);
  }, [open, hasChat]);

  useEffect(() => {
    if (open && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages, open, sending]);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        setUnseen(false);
        const last = messages[messages.length - 1];
        seenRef.current = last ? last.id : seenRef.current;
      }
      return next;
    });
  }

  function newChat() {
    sessionRef.current += 1;
    localStorage.removeItem(TOKEN_KEY);
    setHasChat(false);
    setReady(false);
    setMessages([]);
    setName("");
    setEmail("");
    setPhone("");
    setDraft("");
    setError("");
    setUnseen(false);
    setSending(false);
    seenRef.current = 0;
  }

  async function startChat(event) {
    event.preventDefault();
    if (sending) return;
    const session = sessionRef.current;
    const token = currentToken();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/admin/api/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Chat-Token": token } : {}),
        },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim(), name: name.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!stillThisChat(session, token)) return;
      if (!response.ok) {
        setError(body.message || "Enter your email and phone number.");
        return;
      }
      if (body.data && body.data.token) {
        localStorage.setItem(TOKEN_KEY, body.data.token);
        setHasChat(true);
      }
      setReady(Boolean(body.data && body.data.hasContact));
      setMessages((body.data && body.data.messages) || []);
      setStaffOnline(Boolean(body.data && body.data.staffOnline));
    } catch {
      setError("Those details could not be saved.");
    } finally {
      setSending(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const session = sessionRef.current;
    const token = currentToken();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/admin/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Chat-Token": token } : {}),
        },
        body: JSON.stringify({ text, name: name.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!stillThisChat(session, token)) return;
      if (!response.ok) {
        setError(body.message || "The message could not be sent.");
        return;
      }
      if (body.data && body.data.token) localStorage.setItem(TOKEN_KEY, body.data.token);
      const next = (body.data && body.data.messages) || [];
      setMessages(next);
      setStaffOnline(Boolean(body.data && body.data.staffOnline));
      setDraft("");
      const last = next[next.length - 1];
      seenRef.current = last ? last.id : seenRef.current;
    } catch {
      setError("The message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  const status = staffOnline ? "Customer support is here" : "Customer support is away";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-28 flex justify-end px-3 sm:bottom-14 sm:px-5 ${open ? "z-[1100]" : "z-[80]"}`}
    >
      <div className="pointer-events-auto flex w-[min(380px,100%)] flex-col items-end">
      {open && (
        <section
          role="dialog"
          aria-label="Live chat"
          className="mb-3 flex h-[calc(100dvh-12rem)] w-full flex-col overflow-hidden rounded-2xl border border-[#d7e7b0] bg-white shadow-2xl sm:h-[calc(100dvh-8.5rem)]"
        >
          <header className={`flex items-center justify-between gap-2 px-3 py-2.5 text-white ${ready ? "bg-[#88C300]" : "bg-[#1a202c]"}`}>
            {ready ? (
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={supportPhoto}
                  alt="Globeflight customer support"
                  className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover object-[center_18%]"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold leading-tight">Globeflight Kenya</h2>
                  <p className="truncate text-xs">Globeflight Support team</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-base font-bold">Globeflight</h2>
                <p className="text-xs text-[#d7e7b0]">{status}</p>
              </div>
            )}
            <div className="flex shrink-0 items-center gap-1">
              {ready && (
                <button
                  type="button"
                  onClick={newChat}
                  className="rounded-full px-2 py-1 text-sm text-white hover:bg-white/10"
                  aria-label="New chat"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={toggle}
                className="rounded-full px-2 py-1 text-sm text-white hover:bg-white/10"
                aria-label="Close chat"
              >
                Close
              </button>
            </div>
          </header>
          <div ref={scroller} className={`flex-1 space-y-3 overflow-y-auto px-3 py-3 ${ready ? "bg-white" : "bg-[#f7f8f4]"}`}>
            {!ready && (
              <p className="rounded-xl bg-white px-3 py-2 text-sm leading-5 text-gray-600">
                Enter your email and phone number so customer support can reach you. Then you can start the chat.
              </p>
            )}
            {ready && (
              <>
                <div className="ml-auto max-w-[88%] rounded-2xl bg-[#e5e5e5] px-4 py-3 text-sm leading-6 text-gray-900">
                  <p>Name : Globeflight Kenya</p>
                  <p>
                    Email :{" "}
                    <a className="underline" href="mailto:cs@globeflight.co.ke">cs@globeflight.co.ke</a>
                  </p>
                  <p>
                    Phone :{" "}
                    <a className="underline" href="tel:+254729341277">+254 729 341 277</a>
                  </p>
                </div>
                <div>
                  <p className="mb-1 pl-12 text-sm text-gray-800">Globeflight Kenya</p>
                  <div className="flex items-end gap-2">
                    <img
                      src={supportPhoto}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full bg-[#f3f3f3] object-cover object-[center_18%]"
                    />
                    <div className="max-w-[78%] rounded-2xl bg-[#1f9d4a] px-3 py-2 text-sm leading-5 text-white">
                      Hello! How can I assist you today with Globeflight Kenya?
                    </div>
                  </div>
                </div>
              </>
            )}
            {ready && messages.map((message) => {
              const mine = message.from === "visitor";
              if (mine) {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#ececec] px-3 py-2 text-sm text-gray-800">
                      <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{when(message.createdAt)}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id}>
                  <p className="mb-1 pl-12 text-sm text-gray-800">{message.authorName || "Globeflight Kenya"}</p>
                  <div className="flex items-end gap-2">
                    <img
                      src={supportPhoto}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full bg-[#f3f3f3] object-cover object-[center_18%]"
                    />
                    <div className="max-w-[78%] rounded-2xl bg-[#1f9d4a] px-3 py-2 text-sm text-white">
                      <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                      <p className="mt-1 text-[11px] text-white/80">{when(message.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {sending && ready && !staffOnline && (
              <p className="text-xs text-gray-500">The assistant is replying…</p>
            )}
          </div>
          <form onSubmit={ready ? send : startChat} className="border-t border-gray-100 bg-white p-3">
            {!ready && (
              <div className="mb-2 space-y-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={60}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#88C300]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  maxLength={120}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#88C300]"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number"
                  maxLength={20}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#88C300]"
                />
              </div>
            )}
            {ready && (
              <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                maxLength={1000}
                placeholder="Type here and press enter.."
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#88C300]"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-lg bg-[#88C300] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Send
              </button>
              </div>
            )}
            {!ready && (
              <button
                type="submit"
                disabled={sending || !email.trim() || !phone.trim()}
                className="w-full rounded-lg bg-[#88C300] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {sending ? "Saving…" : "Start chat"}
              </button>
            )}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </form>
        </section>
      )}
      {!open && (
      <button
        type="button"
        onClick={toggle}
        aria-label="Open live chat"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#88C300] text-white shadow-lg hover:bg-[#6ea000]"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 3.5V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {unseen && (
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-[#1a202c] ring-2 ring-white" />
        )}
      </button>
      )}
      </div>
    </div>
  );
}
