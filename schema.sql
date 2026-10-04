-- ============================================================
-- VAY PERFUME — схема базы данных Supabase
-- Выполнить целиком в Supabase Dashboard → SQL Editor → New query → Run
-- Можно запускать один раз; повторный запуск безопасен (IF NOT EXISTS).
-- ============================================================

-- ---------- ТОВАРЫ ----------
create table if not exists fragrances (
  id             text primary key,                 -- напр. 'him-01' или новый slug
  name           text not null,
  brand          text default '',
  category       text not null default 'him'       -- 'him' | 'her' | 'unisex'
                 check (category in ('him','her','unisex')),
  volume         text default '',
  price          text default '',                  -- строкой, как на сайте: "3 500 ₽"
  old_price      text default '',
  feel           text default '',                  -- описание "как пахнет"
  notes_top      text default '',
  notes_heart    text default '',
  notes_base     text default '',
  character      text default '',                  -- короткая характеристика
  type           text default '',                   -- '' | 'original' | 'copy'
  in_stock       boolean not null default true,
  image_url      text default '',                   -- ссылка из Supabase Storage
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- ОТЗЫВЫ ----------
create table if not exists reviews (
  id             text primary key,
  image_url      text not null,
  alt            text default 'Отзыв клиента VAY PERFUME',
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- FAQ ----------
create table if not exists faq (
  id             bigint generated always as identity primary key,
  question       text not null,
  answer         text not null,
  sort_order     integer not null default 0,
  is_visible     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- автообновление updated_at ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_fragrances_updated on fragrances;
create trigger trg_fragrances_updated before update on fragrances
  for each row execute function set_updated_at();

drop trigger if exists trg_reviews_updated on reviews;
create trigger trg_reviews_updated before update on reviews
  for each row execute function set_updated_at();

drop trigger if exists trg_faq_updated on faq;
create trigger trg_faq_updated before update on faq
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Публично: только чтение видимых записей.
-- Изменение (insert/update/delete): только авторизованный пользователь
-- (то есть любой, кто вошёл через Supabase Auth — вход открываем
-- только вам вручную, публичной регистрации на сайте нет).
-- ============================================================
alter table fragrances enable row level security;
alter table reviews    enable row level security;
alter table faq        enable row level security;

drop policy if exists "public read visible fragrances" on fragrances;
create policy "public read visible fragrances" on fragrances
  for select using (is_visible = true);

drop policy if exists "auth full access fragrances" on fragrances;
create policy "auth full access fragrances" on fragrances
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "public read visible reviews" on reviews;
create policy "public read visible reviews" on reviews
  for select using (is_visible = true);

drop policy if exists "auth full access reviews" on reviews;
create policy "auth full access reviews" on reviews
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "public read visible faq" on faq;
create policy "public read visible faq" on faq
  for select using (is_visible = true);

drop policy if exists "auth full access faq" on faq;
create policy "auth full access faq" on faq
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE — фото товаров
-- Бакет создаётся отдельно в Dashboard → Storage (см. README),
-- политики ниже добавляются туда же через SQL Editor ПОСЛЕ
-- создания бакета с именем fragrance-photos.
-- ============================================================
drop policy if exists "public read fragrance photos" on storage.objects;
create policy "public read fragrance photos" on storage.objects
  for select using (bucket_id = 'fragrance-photos');

drop policy if exists "auth upload fragrance photos" on storage.objects;
create policy "auth upload fragrance photos" on storage.objects
  for insert with check (bucket_id = 'fragrance-photos' and auth.role() = 'authenticated');

drop policy if exists "auth update fragrance photos" on storage.objects;
create policy "auth update fragrance photos" on storage.objects
  for update using (bucket_id = 'fragrance-photos' and auth.role() = 'authenticated');

drop policy if exists "auth delete fragrance photos" on storage.objects;
create policy "auth delete fragrance photos" on storage.objects
  for delete using (bucket_id = 'fragrance-photos' and auth.role() = 'authenticated');
