// Скопируйте этот файл в supabase-config.js (то же имя без .example)
// и впишите свои значения из Supabase Dashboard → Settings → API.
//
// ВАЖНО про безопасность:
// SUPABASE_ANON_KEY — это НЕ секретный ключ. Он специально предназначен
// для использования в браузере и виден любому посетителю сайта (это
// нормально и ожидаемо для Supabase). Реальная защита данных — это
// Row Level Security (RLS) в базе, которая уже настроена в schema.sql:
// читать может любой, а добавлять/менять/удалять — только тот, кто
// вошёл через Supabase Auth на странице /admin.html.
//
// НИКОГДА не помещайте сюда "service_role" ключ — он даёт полный доступ
// в обход RLS и должен оставаться только в Supabase Dashboard.

window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
