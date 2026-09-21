'use client';

import { useEffect, type ReactNode } from 'react';
import { LanguageProvider } from './language';

export default function ForcedLanguage({
  language,
  children,
}: {
  language: 'zh' | 'en';
  children: ReactNode;
}) {
  useEffect(() => {
    document.cookie = `uscoo_language=${language}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);
  return (
    <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
  );
}
