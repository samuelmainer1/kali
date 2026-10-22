(function () {
  var panel = null;
  var anchor = null;

  function notes() {
    return Array.isArray(window.__gfNotes) ? window.__gfNotes : [];
  }

  function when(iso) {
    var then = new Date(iso).getTime();
    if (!then) return '';
    var mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    var hours = Math.round(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hr ago' : hours + ' hr ago';
    return new Intl.DateTimeFormat('en-KE', {
      timeZone: 'Africa/Nairobi',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  function close() {
    if (panel) panel.remove();
    panel = null;
    anchor = null;
  }

  function place() {
    if (!panel || !anchor || !anchor.isConnected) return;
    var rect = anchor.getBoundingClientRect();
    var width = panel.offsetWidth;
    var left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    panel.style.top = Math.round(rect.bottom + 10) + 'px';
    panel.style.left = Math.round(left) + 'px';
  }

  function mark(body) {
    var token = localStorage.getItem('token');
    return fetch('/admin/api/notifications/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? 'Bearer ' + token : '',
      },
      body: JSON.stringify(body),
    }).then(function () {
      if (window.gfRefreshNotes) return window.gfRefreshNotes();
    });
  }

  function itemView(note) {
    var button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = [
      'display:block',
      'width:100%',
      'text-align:left',
      'border:0',
      'border-bottom:1px solid #eef2e8',
      'background:' + (note.isRead ? '#fff' : '#f7fbea'),
      'padding:12px 16px',
      'cursor:pointer',
      'font:inherit',
    ].join(';');

    var label = document.createElement('div');
    label.textContent = note.type === 'subscriber' ? 'Newsletter' : note.type === 'chat' ? 'Live chat' : 'Message';
    label.style.cssText = 'font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5f8a00';

    var title = document.createElement('div');
    title.textContent = note.title || 'Notification';
    title.style.cssText = 'margin-top:3px;font-size:14px;font-weight:700;color:#1a202c';

    var detail = document.createElement('div');
    detail.textContent = note.detail || '';
    detail.style.cssText = 'margin-top:3px;font-size:13px;line-height:1.4;color:#4a5568';

    var time = document.createElement('div');
    time.textContent = when(note.createdAt);
    time.style.cssText = 'margin-top:4px;font-size:12px;color:#718096';

    button.append(label, title, detail, time);
    button.addEventListener('click', function () {
      mark({ id: note.id }).finally(function () {
        if (note.type === 'chat' && window.gfOpenChat) {
          close();
          window.gfOpenChat();
          return;
        }
        window.location.assign('/admin' + (note.link || '/'));
      });
    });
    return button;
  }

  function render() {
    if (panel) panel.remove();
    var list = notes();
    var unread = list.filter(function (note) { return !note.isRead; }).length;
    panel = document.createElement('div');
    panel.id = 'gf-notes';
    panel.style.cssText = [
      'position:fixed',
      'z-index:2000',
      'width:min(380px, calc(100vw - 24px))',
      'max-height:min(480px, calc(100vh - 90px))',
      'overflow:auto',
      'background:#fff',
      'border-radius:14px',
      'box-shadow:0 16px 40px rgba(26,32,44,.18)',
      'border:1px solid #e6eed4',
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    ].join(';');

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #eef2e8;position:sticky;top:0;background:#fff';
    var heading = document.createElement('div');
    heading.textContent = unread ? 'Notifications (' + unread + ')' : 'Notifications';
    heading.style.cssText = 'font-size:15px;font-weight:800;color:#1a202c';
    head.appendChild(heading);
    if (unread) {
      var all = document.createElement('button');
      all.type = 'button';
      all.textContent = 'Mark all read';
      all.style.cssText = 'border:0;background:transparent;color:#5f8a00;font-weight:700;cursor:pointer;font-size:13px';
      all.addEventListener('click', function () {
        mark({ all: true }).then(render);
      });
      head.appendChild(all);
    }
    panel.appendChild(head);

    if (!list.length) {
      var empty = document.createElement('div');
      empty.textContent = 'You are up to date. New messages and newsletter sign-ups will show here.';
      empty.style.cssText = 'padding:22px 16px;color:#4a5568;font-size:14px;line-height:1.5';
      panel.appendChild(empty);
    } else {
      list.forEach(function (note) { panel.appendChild(itemView(note)); });
    }

    document.body.appendChild(panel);
    place();
  }

  window.gfOpenNotes = function (button) {
    if (panel && anchor === button) {
      close();
      return;
    }
    anchor = button;
    var refresh = window.gfRefreshNotes ? window.gfRefreshNotes() : Promise.resolve();
    Promise.resolve(refresh).then(render, render);
  };

  document.addEventListener('mousedown', function (event) {
    if (!panel) return;
    if (panel.contains(event.target)) return;
    if (anchor && anchor.contains(event.target)) return;
    close();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
  window.addEventListener('resize', place);
  window.addEventListener('focus', function () {
    if (window.gfRefreshNotes) window.gfRefreshNotes();
  });
})();
