// ==UserScript==
// @name         MUSE – Hộp thoại xác nhận công ca
// @namespace    https://github.com/nnnluv7/autoclick
// @version      1.1.0
// @description  Tự trả lời OK cho câu hỏi công ca trong lượt bấm Xác nhận công của Insite.
// @match        https://newinsite.thegioididong.com/*
// @updateURL    https://raw.githubusercontent.com/nnnluv7/autoclick/main/muse-xac-nhan-cong.user.js
// @downloadURL  https://raw.githubusercontent.com/nnnluv7/autoclick/main/muse-xac-nhan-cong.user.js
// @run-at       document-start
// @sandbox      raw
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  if (window.top !== window.self) return;

  const origin = 'https://newinsite.thegioididong.com';
  const attendancePath = /^\/office\/xac-nhan-congca\/?$/;
  const actionName = /^xác nhận (?:chấm )?công(?: ca)?$/iu;
  const question = /^bạn có đồng ý (?:xác )?nhận chấm công\s*[,;.:]?\s*số ca sẽ xác nhận\s*:?\s*(\d+)\s*[?!.]?$/iu;
  const clickable = 'button, a, input[type="button"], input[type="submit"], [role="button"], [onclick], [ng-click], [data-ng-click], .btn';
  const nativeConfirm = window.confirm;
  const waitMs = 30000;
  const doubleClickMs = 1000;
  const ready = 'Tự OK khi bấm Xác nhận công';
  let active = null;
  let status = null;
  let pageUrl = location.href;

  function onAttendancePage() {
    return location.origin === origin && attendancePath.test(location.pathname);
  }

  function normalize(text) {
    return (text || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  }

  function isAction(element) {
    if (!(element instanceof HTMLElement) || !element.matches(clickable)) return false;
    if (element.matches(':disabled') || element.closest('[hidden], [inert], [aria-disabled="true"]')) return false;
    const label = element instanceof HTMLInputElement ? element.value : element.textContent;
    return [label, element.getAttribute('aria-label'), element.title]
      .some(value => actionName.test(normalize(value)));
  }

  function showStatus(message) {
    if (!document.body || !onAttendancePage()) return;
    if (!status?.isConnected) {
      status = document.createElement('div');
      status.id = 'muse-cong-status';
      status.lang = 'vi';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      status.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;max-width:min(420px,86vw);box-sizing:border-box;padding:7px 12px;border-radius:8px;background:#172b41;color:white;font:500 14px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px #172b4133;pointer-events:none';
      document.body.append(status);
    }
    if (status.textContent !== message) status.textContent = message;
  }

  function clearAttempt() {
    if (active) clearTimeout(active.timer);
    active = null;
  }

  function resetPage() {
    clearAttempt();
    status?.remove();
    status = null;
    pageUrl = '';
  }

  function syncPage() {
    if (pageUrl !== location.href) {
      resetPage();
      pageUrl = location.href;
    }
    if (!status?.isConnected) showStatus(ready);
  }

  function expire(attempt) {
    if (active !== attempt) return;
    clearAttempt();
    if (attempt.answeredAt === null && attempt.url === location.href) {
      showStatus('Insite chưa hiện câu hỏi xác nhận công trong 30 giây.');
    }
  }

  window.addEventListener('click', event => {
    if (!onAttendancePage()) return;
    const button = event.composedPath().find(isAction);
    if (!button) {
      clearAttempt();
      return;
    }
    const now = performance.now();
    if (active && active.url === location.href && now <= active.deadline &&
        (active.answeredAt === null || now - active.answeredAt < doubleClickMs)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    clearAttempt();
    const attempt = { url: location.href, click: event, deadline: now + waitMs, answeredAt: null };
    active = attempt;
    attempt.timer = setTimeout(() => expire(attempt), waitMs);
    showStatus('Đã bấm Xác nhận công. Đang chờ câu hỏi của Insite…');
  }, true);

  // Answer the original site handler synchronously. Never replay its click:
  // cancellation and replay could otherwise discard unsaved form selections.
  window.confirm = function (message) {
    if (!onAttendancePage() || !active || active.url !== location.href || typeof message !== 'string') {
      return Reflect.apply(nativeConfirm, window, arguments);
    }
    const match = question.exec(normalize(message));
    if (!match) return Reflect.apply(nativeConfirm, window, arguments);
    const now = performance.now();
    if (now > active.deadline) {
      expire(active);
      return Reflect.apply(nativeConfirm, window, arguments);
    }
    if (active.answeredAt !== null) return false;
    active.answeredAt = now;
    showStatus('Đã bấm OK cho ' + match[1] + ' ca. Xem kết quả từ Insite.');
    return true;
  };

  function onEdit(event) {
    // The site's own synchronous form normalization is part of the same action.
    if (active?.click && active.click.eventPhase !== Event.NONE) return;
    if (active?.answeredAt != null && !event.isTrusted) return;
    clearAttempt();
    if (onAttendancePage()) showStatus(ready);
  }

  window.addEventListener('input', onEdit, true);
  window.addEventListener('change', onEdit, true);
  window.addEventListener('pagehide', resetPage);
  window.addEventListener('pageshow', syncPage);
  window.addEventListener('popstate', syncPage);
  window.addEventListener('hashchange', syncPage);
  window.navigation?.addEventListener('currententrychange', syncPage);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPage, { once: true });
  } else {
    syncPage();
  }
})();
