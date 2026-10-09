/* LearnLoop phone app: where the family's data lives.
 * On the phone, Android keeps it in the app's private storage through the LLAndroid bridge.
 * In a desktop browser preview it falls back to localStorage, so the pages can be tried and tested without a phone. */
(function (root) {
  'use strict';
  const N = () => root.LLAndroid || null;
  function load() {
    let txt = null;
    try { txt = N() ? N().loadDb() : root.localStorage.getItem('learnloop-db'); } catch (e) { txt = null; }
    let db = null; try { db = txt ? JSON.parse(txt) : null; } catch (e) { db = null; }
    if (!db) db = root.LLCore.emptyDb();
    db.best = db.best || {}; db.levelLog = db.levelLog || {};
    return db;
  }
  function save(db) {
    const txt = JSON.stringify(db);
    if (N()) N().saveDb(txt); else root.localStorage.setItem('learnloop-db', txt);
  }
  // Calls into Android. Returns null in a browser preview, so every caller must cope without it.
  function native(name, ...args) { try { const n = N(); return n && typeof n[name] === 'function' ? n[name](...args) : null; } catch (e) { return null; } }
  function nativeJson(name, ...args) { const t = native(name, ...args); try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  root.LLStore = { load, save, native, nativeJson };
})(window);
