import { useEffect, useRef, useState } from "react";

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
    if (!token) {
      try {
        const status = await fetch("/admin/api/chat/status");
        if (!stillThisChat(session, token)) return;
        if (status.ok) {
          const body = await status.json();
          setStaffOnline(Boolean(body.data && body.data.staffOnline));
        }
      } catch {
        /* The window still opens if the status check fails. */
      }
      return;
    }
    try {
      const response = await fetch("/admin/api/chat", {
        headers: { "X-Chat-Token": token },
      });
      if (!stillThisChat(session, token)) return;
      if (response.status === 404) {
        localStorage.removeItem(TOKEN_KEY);
        return;
      }
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
    load();
    const timer = setInterval(load, open ? 2500 : 15000);
    return () => clearInterval(timer);
  }, [open]);

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
      if (body.data && body.data.token) localStorage.setItem(TOKEN_KEY, body.data.token);
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
      className="pointer-events-none fixed inset-x-0 bottom-36 z-[80] flex justify-end px-3 sm:bottom-24 sm:px-5"
    >
      <div className="pointer-events-auto flex w-[min(380px,100%)] flex-col items-end">
      {open && (
        <section
          role="dialog"
          aria-label="Live chat"
          className="mb-3 flex h-[min(480px,calc(100dvh-13rem))] w-full flex-col overflow-hidden rounded-2xl border border-[#d7e7b0] bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 bg-[#1a202c] px-4 py-3 text-white">
            <div>
              <h2 className="text-base font-bold">Globeflight</h2>
              <p className="text-xs text-[#d7e7b0]">{status}</p>
            </div>
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
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8f4] px-3 py-3">
            <p className="rounded-xl bg-white px-3 py-2 text-sm leading-5 text-gray-600">
              {ready
                ? "Ask about shipping, tracking, or customs. For a quote or inquiry, email sam.maina@globeflight.co.ke. A person replies when customer support is signed in. Otherwise the assistant replies."
                : "Enter your email and phone number so customer support can reach you. Then you can start the chat."}
            </p>
            {ready && messages.map((message) => {
              const mine = message.from === "visitor";
              return (
                <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      mine
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-[#88C300] px-3 py-2 text-sm text-white"
                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                    }
                  >
                    {!mine && (
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#5f8a00]">
                        {message.authorName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                    <p className={mine ? "mt-1 text-[11px] text-white/80" : "mt-1 text-[11px] text-gray-400"}>
                      {when(message.createdAt)}
                    </p>
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
                placeholder="Write a message"
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
