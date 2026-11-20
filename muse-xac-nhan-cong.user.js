// ==UserScript==
// @name         MUSE – Hộp thoại xác nhận công ca
// @namespace    https://github.com/nnnluv7/autoclick
// @version      1.0.0
// @description  Hiển thị câu hỏi xác nhận công ca của Insite bằng nút OK và Hủy ngay trên trang.
// @match        https://newinsite.thegioididong.com/*
// @run-at       document-start
// @sandbox      raw
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const origin = 'https://newinsite.thegioididong.com';
  const path = /^\/office\/xac-nhan-congca\/?$/;
  const question = /^bạn có đồng ý (?:xác )?nhận chấm công\s*[,;.:]?\s*số ca sẽ xác nhận\s*:?\s*\d+\s*[?!.]?$/iu;
  const actionName = /^xác nhận (?:chấm )?công(?: ca)?$/iu;
  const clickable = 'button, a, input[type="button"], input[type="submit"], [role="button"], [onclick], [ng-click], [data-ng-click], .btn';
  const nativeConfirm = window.confirm;
  const timeoutMs = 30000;
  let attempt = null;
  let nextClick = null;
  let view = null;

  function onAttendancePage() {
    return location.origin === origin && path.test(location.pathname);
  }

  function normalize(text) {
    return (text || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  }

  function isAction(element) {
    if (!(element instanceof HTMLElement) || !element.matches(clickable)) return false;
    const label = element instanceof HTMLInputElement ? element.value : element.textContent;
    return [label, element.getAttribute('aria-label'), element.title]
      .some(value => actionName.test(normalize(value)));
  }

  // Watch for edits while the question is visible without copying employee data.
  function watchSelection() {
    const grids = [...document.querySelectorAll('tbody, [role="rowgroup"]')];
    let edited = false;
    const markEdited = () => { edited = true; };
    const observer = new MutationObserver(markEdited);
    for (const grid of grids) {
      observer.observe(grid, { subtree: true, childList: true, characterData: true });
    }
    document.addEventListener('input', markEdited, true);
    document.addEventListener('change', markEdited, true);
    return {
      fresh() {
        if (observer.takeRecords().length || grids.some(grid => !grid.isConnected)) edited = true;
        return !edited;
      },
      stop() {
        observer.disconnect();
        document.removeEventListener('input', markEdited, true);
        document.removeEventListener('change', markEdited, true);
      }
    };
  }

  function forgetAttempt() {
    if (!attempt) return;
    clearTimeout(attempt.timer);
    attempt.approval?.selection.stop();
    attempt = null;
  }

  function closeView() {
    if (!view) return;
    const { dialog, selection } = view;
    view = null;
    selection.stop();
    if (dialog.open) dialog.close();
    dialog.remove();
  }

  function reset() {
    nextClick = null;
    forgetAttempt();
    closeView();
  }

  function showQuestion(message, action) {
    const dialog = document.createElement('dialog');
    dialog.id = 'muse-cong-dialog';
    dialog.lang = 'vi';
    dialog.setAttribute('aria-labelledby', 'muse-cong-title');
    dialog.setAttribute('aria-describedby', 'muse-cong-message');
    dialog.style.cssText = 'box-sizing:border-box;width:min(460px,92vw);max-height:90vh;margin:auto;padding:24px;border:1px solid #b8c3cf;border-radius:14px;background:white;color:#172333;font:16px/1.5 system-ui,sans-serif;box-shadow:0 12px 48px #14263840';

    const title = document.createElement('h2');
    title.id = 'muse-cong-title';
    title.textContent = 'Xác nhận công ca';
    title.style.cssText = 'font:600 20px/1.3 system-ui,sans-serif;margin:0 0 12px;color:inherit';
    const body = document.createElement('p');
    body.id = 'muse-cong-message';
    body.textContent = message;
    body.style.cssText = 'margin:0 0 22px;white-space:pre-wrap;color:inherit';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:10px';
    const cancel = document.createElement('button');
    const ok = document.createElement('button');
    for (const button of [cancel, ok]) {
      button.type = 'button';
      button.style.cssText = 'min-width:80px;padding:8px 16px;border:1px solid #aab7c4;border-radius:8px;background:#fff;color:#172333;font:600 16px/1.4 system-ui,sans-serif;cursor:pointer';
    }
    cancel.id = 'muse-cong-cancel';
    cancel.textContent = 'Hủy';
    cancel.autofocus = true;
    ok.id = 'muse-cong-ok';
    ok.textContent = 'OK';
    ok.style.background = '#125bb7';
    ok.style.color = '#fff';
    actions.append(cancel, ok);
    dialog.append(title, body, actions);
    document.body.append(dialog);

    const selection = watchSelection();
    view = { dialog, selection, url: action.url };
    cancel.addEventListener('click', reset);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      reset();
    });
    dialog.addEventListener('close', () => {
      if (view?.dialog === dialog) reset();
    });
    ok.addEventListener('click', () => {
      if (view?.dialog !== dialog || !dialog.open || ok.disabled) return;
      ok.disabled = true;
      const { button, url } = action;
      if (url !== location.href || !onAttendancePage() || !button.isConnected ||
          !isAction(button) || button.matches(':disabled, [aria-disabled="true"]')) {
        body.textContent = 'Trang đã cập nhật. Đóng hộp thoại rồi bấm lại nút Xác nhận công trên danh sách hiện tại.';
        ok.hidden = true;
        cancel.textContent = 'Đóng';
        cancel.focus();
        return;
      }
      const unchanged = selection.fresh();
      closeView();
      forgetAttempt();
      const approval = unchanged ? {
        message: normalize(message),
        synchronous: action.synchronous,
        selection: watchSelection()
      } : null;
      nextClick = { button, approval };
      // Re-enter the original handler. Only its matching confirmation may succeed once.
      try {
        button.click();
      } finally {
        if (nextClick) approval?.selection.stop();
        nextClick = null;
      }
    });
    dialog.showModal();
    cancel.focus();
  }

  window.addEventListener('click', event => {
    if (!onAttendancePage()) return;
    const chain = event.composedPath();
    if (view && chain.includes(view.dialog)) return;
    const button = chain.find(isAction);
    if (!button) {
      forgetAttempt();
      return;
    }
    // Serialize duplicate clicks while the site is preparing the same question.
    if (view || (!nextClick && attempt?.button === button && !attempt.handled)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    forgetAttempt();
    const approval = nextClick?.button === button ? nextClick.approval : null;
    nextClick = null;
    attempt = { button, url: location.href, approval, event, handled: false, timer: setTimeout(forgetAttempt, timeoutMs) };
  }, true);

  // window.confirm must return a boolean synchronously. The first pass cancels;
  // the in-page OK replays the site action and releases only the reviewed question.
  window.confirm = function (message) {
    const key = typeof message === 'string' ? normalize(message) : '';
    if (!onAttendancePage() || !question.test(key)) return Reflect.apply(nativeConfirm, window, arguments);
    if (view?.url === location.href) return false;
    if (!attempt || attempt.url !== location.href || !attempt.button.isConnected ||
        !document.body || typeof HTMLDialogElement === 'undefined') {
      return Reflect.apply(nativeConfirm, window, arguments);
    }
    if (attempt.handled) return false;
    attempt.handled = true;
    attempt.synchronous = attempt.event.eventPhase !== Event.NONE;
    const approval = attempt.approval;
    if (approval) {
      const matches = approval.message === key && (!approval.synchronous || attempt.synchronous) &&
        approval.selection.fresh();
      approval.selection.stop();
      attempt.approval = null;
      if (matches) return true;
    }
    try {
      showQuestion(message, attempt);
    } catch {
      reset();
      return Reflect.apply(nativeConfirm, window, arguments);
    }
    return false;
  };

  // Release an unfinished attempt after edits or navigation. Chrome's Navigation
  // API also covers same-document route changes from the portal's own menu.
  function afterEdit() {
    if (!view && attempt && !attempt.handled && !attempt.approval) forgetAttempt();
  }
  window.addEventListener('input', afterEdit, true);
  window.addEventListener('change', afterEdit, true);
  function afterNavigation() {
    const previousUrl = view?.url ?? attempt?.url;
    if (previousUrl && previousUrl !== location.href) reset();
  }
  window.addEventListener('pagehide', reset);
  window.addEventListener('popstate', afterNavigation);
  window.addEventListener('hashchange', afterNavigation);
  window.navigation?.addEventListener('currententrychange', afterNavigation);
})();
