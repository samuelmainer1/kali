(function () {
  var state = { chats: [], active: null, thread: null, draft: '', unread: 0, sending: false };
  var panel = null;
  var pollTimer = null;

  function token() {
    return localStorage.getItem('token') || '';
  }

  function authHeaders(json) {
    var headers = { Authorization: token() ? 'Bearer ' + token() : '' };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  }

  function when(iso) {
    var then = new Date(iso).getTime();
    if (!then) return '';
    return new Intl.DateTimeFormat('en-KE', {
      timeZone: 'Africa/Nairobi',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  function api(path, options) {
    return fetch(path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.message || 'Request failed');
        return body;
      });
    });
  }

  function refreshInbox() {
    if (!token()) return Promise.resolve();
    return api('/admin/api/chat/inbox', { headers: authHeaders() }).then(function (body) {
      var data = body.data || {};
      state.chats = data.chats || [];
      state.unread = state.chats.reduce(function (sum, chat) { return sum + (chat.staffUnread || 0); }, 0);
      if (panel) fillList();
    }).catch(function () {});
  }

  function openThread(id) {
    state.active = id;
    return api('/admin/api/chat/inbox/' + id, { headers: authHeaders() }).then(function (body) {
      state.thread = body.data;
      if (panel) {
        fillList();
        fillStream();
      }
      if (window.gfRefreshNotes) window.gfRefreshNotes();
    }).catch(function () {});
  }

  function sendReply() {
    var text = state.draft.trim();
    if (!text || !state.active || state.sending) return;
    state.sending = true;
    var sendButton = document.getElementById('gf-chat-send');
    if (sendButton) sendButton.textContent = 'Sending…';
    api('/admin/api/chat/inbox/' + state.active + '/reply', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ text: text }),
    }).then(function (body) {
      state.thread = body.data;
      state.draft = '';
      state.sending = false;
      var input = document.getElementById('gf-chat-draft');
      if (input) input.value = '';
      var sendButton = document.getElementById('gf-chat-send');
      if (sendButton) sendButton.textContent = 'Send';
      fillStream();
      return refreshInbox();
    }).catch(function () {
      state.sending = false;
      var sendButton = document.getElementById('gf-chat-send');
      if (sendButton) sendButton.textContent = 'Send';
    });
  }

  function close() {
    if (panel) panel.remove();
    panel = null;
  }

  function bubble(message) {
    var mine = message.from === 'staff';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;margin:0 0 10px;' + (mine ? 'justify-content:flex-end' : 'justify-content:flex-start');
    var box = document.createElement('div');
    box.style.cssText = 'max-width:80%;border-radius:14px;padding:8px 10px;font-size:14px;line-height:1.4;white-space:pre-wrap;' + (mine ? 'background:#88C300;color:#fff' : 'background:#fff;color:#1a202c;border:1px solid #e6eed4');
    if (!mine) {
      var who = document.createElement('div');
      who.textContent = message.authorName || (message.from === 'ai' ? 'Globeflight Assistant' : 'Visitor');
      who.style.cssText = 'font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#5f8a00;margin-bottom:3px';
      box.appendChild(who);
    }
    var text = document.createElement('div');
    text.textContent = message.text || '';
    var time = document.createElement('div');
    time.textContent = when(message.createdAt);
    time.style.cssText = 'margin-top:4px;font-size:11px;opacity:.75';
    box.append(text, time);
    wrap.appendChild(box);
    return wrap;
  }

  function fillList() {
    var list = document.getElementById('gf-chat-list');
    if (!list) return;
    list.textContent = '';
    if (!state.chats.length) {
      var empty = document.createElement('div');
      empty.textContent = 'No chats yet. A visitor message will show here.';
      empty.style.cssText = 'padding:16px;color:#4a5568;font-size:13px;line-height:1.45';
      list.appendChild(empty);
      return;
    }
    state.chats.forEach(function (chat) {
      var item = document.createElement('button');
      item.type = 'button';
      item.style.cssText = 'display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eef2e8;padding:12px;cursor:pointer;background:' + (String(state.active) === String(chat.id) ? '#f3f8e6' : '#fff');
      var name = document.createElement('div');
      name.textContent = chat.visitorName || chat.visitorEmail || 'Visitor';
      name.style.cssText = 'font-weight:800;font-size:14px;color:#1a202c';
      var contact = document.createElement('div');
      contact.textContent = [chat.visitorPhone, chat.visitorEmail].filter(Boolean).join(' · ');
      contact.style.cssText = 'margin-top:2px;font-size:12px;color:#2d3748';
      var preview = document.createElement('div');
      preview.textContent = chat.preview || 'New chat';
      preview.style.cssText = 'margin-top:3px;font-size:12px;color:#4a5568;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      item.append(name, contact, preview);
      if (chat.staffUnread) {
        var dot = document.createElement('div');
        dot.textContent = chat.staffUnread + ' new';
        dot.style.cssText = 'margin-top:4px;font-size:11px;font-weight:800;color:#5f8a00';
        item.appendChild(dot);
      }
      item.addEventListener('click', function () { openThread(chat.id); });
      list.appendChild(item);
    });
  }

  function fillStream() {
    var stream = document.getElementById('gf-chat-stream');
    if (!stream) return;
    var nearBottom = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 80;
    stream.textContent = '';
    var thread = state.thread && String(state.thread.id) === String(state.active) ? state.thread : null;
    var messages = thread ? thread.messages : [];
    if (thread && (thread.visitorEmail || thread.visitorPhone)) {
      var card = document.createElement('div');
      card.style.cssText = 'margin-bottom:12px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #e6eed4';
      var who = document.createElement('div');
      who.textContent = thread.visitorName || 'Visitor';
      who.style.cssText = 'font-weight:800;color:#1a202c';
      var mail = document.createElement('div');
      mail.textContent = thread.visitorEmail || '';
      mail.style.cssText = 'margin-top:2px;font-size:13px;color:#2d3748';
      var tel = document.createElement('div');
      tel.textContent = thread.visitorPhone || '';
      tel.style.cssText = 'font-size:13px;color:#2d3748';
      card.append(who, mail, tel);
      stream.appendChild(card);
    }
    if (!state.active) {
      var hint = document.createElement('div');
      hint.textContent = 'Choose a chat to reply.';
      hint.style.cssText = 'color:#4a5568;font-size:14px';
      stream.appendChild(hint);
    } else if (!messages.length) {
      var waiting = document.createElement('div');
      waiting.textContent = 'Waiting for the first message.';
      waiting.style.cssText = 'color:#4a5568;font-size:14px';
      stream.appendChild(waiting);
    } else {
      messages.forEach(function (message) { stream.appendChild(bubble(message)); });
    }
    if (nearBottom) stream.scrollTop = stream.scrollHeight;
  }

  function render() {
    if (panel) panel.remove();
    panel = document.createElement('section');
    panel.id = 'gf-staff-chat';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Live chat inbox');
    panel.style.cssText = [
      'position:fixed',
      'z-index:2000',
      'right:16px',
      'bottom:16px',
      'width:min(760px,calc(100vw - 24px))',
      'height:min(560px,calc(100vh - 90px))',
      'background:#fff',
      'border:1px solid #e6eed4',
      'border-radius:16px',
      'box-shadow:0 18px 50px rgba(26,32,44,.2)',
      'display:flex',
      'flex-direction:column',
      'overflow:hidden',
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    ].join(';');

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#1a202c;color:#fff';
    var title = document.createElement('div');
    var heading = document.createElement('div');
    heading.textContent = 'Live chat';
    heading.style.cssText = 'font-weight:800';
    var sub = document.createElement('div');
    sub.textContent = 'You are signed in, so you answer these chats.';
    sub.style.cssText = 'font-size:12px;color:#d7e7b0';
    title.append(heading, sub);
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer';
    closeBtn.addEventListener('click', close);
    head.append(title, closeBtn);

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;display:flex;min-height:0';

    var list = document.createElement('div');
    list.id = 'gf-chat-list';
    list.style.cssText = 'width:240px;max-width:46%;border-right:1px solid #eef2e8;overflow:auto;background:#fafbf8';

    var thread = document.createElement('div');
    thread.style.cssText = 'flex:1;display:flex;flex-direction:column;min-width:0;background:#f7f8f4';
    var stream = document.createElement('div');
    stream.id = 'gf-chat-stream';
    stream.style.cssText = 'flex:1;overflow:auto;padding:12px';
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #eef2e8';
    var input = document.createElement('textarea');
    input.id = 'gf-chat-draft';
    input.placeholder = 'Write a reply';
    input.value = state.draft;
    input.rows = 2;
    input.style.cssText = 'flex:1;resize:none;border:1px solid #d9e2c8;border-radius:8px;padding:8px;font:inherit';
    input.addEventListener('input', function () { state.draft = input.value; });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendReply();
      }
    });
    var send = document.createElement('button');
    send.type = 'submit';
    send.id = 'gf-chat-send';
    send.textContent = state.sending ? 'Sending…' : 'Send';
    send.disabled = state.sending;
    send.style.cssText = 'border:0;border-radius:8px;background:#88C300;color:#fff;font-weight:800;padding:0 14px;cursor:pointer';
    form.append(input, send);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      state.draft = input.value;
      sendReply();
    });
    thread.append(stream, form);
    body.append(list, thread);
    panel.append(head, body);
    document.body.appendChild(panel);
    fillList();
    fillStream();
  }

  window.gfOpenChat = function () {
    if (panel) {
      close();
      return;
    }
    refreshInbox().then(function () {
      render();
      if (state.active) openThread(state.active);
    });
  };

  function mount() {
    var existing = document.getElementById('gf-chat-btn');
    if (!token()) {
      if (existing) existing.remove();
      close();
      return;
    }
    var bell = document.querySelector('[aria-label="Notifications"]');
    if (!bell || !bell.parentNode) return;
    var button = existing;
    if (!button) {
      button = document.createElement('button');
      button.id = 'gf-chat-btn';
      button.type = 'button';
      button.setAttribute('aria-label', 'Live chat');
      button.style.cssText = 'position:relative;width:40px;height:40px;border:0;border-radius:999px;background:transparent;color:#1a202c;cursor:pointer;display:inline-flex;align-items:center;justify-content:center';
      button.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 3.5V6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path></svg>';
      var badge = document.createElement('span');
      badge.dataset.badge = '1';
      badge.style.cssText = 'display:none;position:absolute;top:2px;right:0;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#88C300;color:#1a202c;font-size:10px;font-weight:800;align-items:center;justify-content:center';
      button.appendChild(badge);
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.gfOpenChat();
      });
      bell.parentNode.insertBefore(button, bell);
    }
    var badgeNode = button.querySelector('[data-badge]');
    if (badgeNode) {
      badgeNode.textContent = state.unread > 9 ? '9+' : String(state.unread);
      badgeNode.style.display = state.unread ? 'flex' : 'none';
    }
  }

  function beat() {
    if (!token()) return;
    fetch('/admin/api/chat/presence', { method: 'POST', headers: authHeaders(true), body: '{}' }).catch(function () {});
  }

  setInterval(mount, 800);
  setInterval(function () {
    beat();
    refreshInbox();
    if (panel && state.active) openThread(state.active);
  }, 4000);
  document.addEventListener('mousedown', function (event) {
    if (!panel) return;
    if (panel.contains(event.target)) return;
    var button = document.getElementById('gf-chat-btn');
    if (button && button.contains(event.target)) return;
    close();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
  setTimeout(function () { beat(); refreshInbox(); }, 600);
  pollTimer = null;
})();
