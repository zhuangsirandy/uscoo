'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { translate, formatCopy, type Language } from '@/lib/translations';
const Context = createContext({
  language: 'en' as Language,
  setLanguage: (_: Language) => {},
  t: (x: any, en?: string): any => en || x,
  f: (key: string, ...values: any[]): string =>
    formatCopy(key, 'en', ...values),
});
const Draft = createContext<{
  values: Record<string, any>;
  set: (key: string, value: SetStateAction<any>) => void;
}>({ values: {}, set: () => {} });
const DraftStorage = createContext<'empty' | 'local' | 'session' | 'memory'>('empty');
export const useDraftStorageStatus = () => useContext(DraftStorage);
const DRAFT_STORAGE_KEY = 'uscoo.public-assessment-draft.v1';
export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  const [language, setLang] = useState(initialLanguage),
    [values, setValues] = useState<Record<string, any>>({});
  const [storageStatus, setStorageStatus] = useState<'empty' | 'local' | 'session' | 'memory'>('empty');
  const setLanguage = (next: Language) => {
    setLang(next);
    document.cookie = `uscoo_language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  };
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      // Try the current-tab store below when persistent storage is restricted.
    }
    if (!saved) {
      try {
        saved = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      } catch {
        // A private-browser storage restriction should never block assessment.
      }
    }
    if (saved) {
      try {
        setValues(JSON.parse(saved));
      } catch {
        // Ignore an unreadable local draft and let the user start normally.
      }
    }
  }, []);
  useEffect(() => {
    if (!Object.keys(values).length) return;
    const draft = JSON.stringify(values);
    let local = false, session = false;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, draft);
      local = true;
    } catch {
      // Keep going: session storage may still be available.
    }
    try {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, draft);
      session = true;
    } catch {
      // Keep the in-memory draft when browser storage is unavailable.
    }
    setStorageStatus(local ? 'local' : session ? 'session' : 'memory');
  }, [values]);
  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        t: (x, en) =>
          language === 'en' && en !== undefined ? en : translate(x, language),
        f: (key, ...values) => formatCopy(key, language, ...values),
      }}
    >
      <Draft.Provider
        value={{
          values,
          set: (key, value) =>
            setValues((old) => ({
              ...old,
              [key]: typeof value === 'function' ? value(old[key]) : value,
            })),
        }}
      >
        <DraftStorage.Provider value={storageStatus}>{children}</DraftStorage.Provider>
      </Draft.Provider>
    </Context.Provider>
  );
}
export const useI18n = () => useContext(Context);
export function useDraftState<T>(
  key: string,
  initial: T,
): [T, (value: SetStateAction<T>) => void] {
  const c = useContext(Draft);
  const value = Object.hasOwn(c.values, key) ? c.values[key] : initial;
  return [
    value,
    (next) =>
      c.set(
        key,
        typeof next === 'function'
          ? (old: T | undefined) =>
              (next as (x: T) => T)(old === undefined ? initial : old)
          : next,
      ),
  ];
}
export function LanguageSwitch() {
  const { language, setLanguage } = useI18n();
  return (
    <div className="language-switch" role="group" aria-label="Language / 语言">
      <button
        type="button"
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={language === 'zh'}
        onClick={() => setLanguage('zh')}
      >
        中文
      </button>
    </div>
  );
}
