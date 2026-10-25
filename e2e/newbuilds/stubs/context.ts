export const useLanguage = () => ({ language: new URLSearchParams(location.search).get('lang') || 'en' });
export const useAuth = () => ({ user: null });
