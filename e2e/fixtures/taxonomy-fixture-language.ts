export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});
