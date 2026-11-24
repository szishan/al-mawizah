-- Public storefront settings; only existing administrators can change them.
begin;
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Al Mawizah' check (length(btrim(store_name)) between 1 and 100),
  store_name_bn text not null default 'আল মাওইযাহ' check (length(store_name_bn) <= 100),
  phone text not null default '+8801577350488' check (phone ~ '^\+?[0-9 ()-]{8,25}$'),
  whatsapp_number text not null default '8801577350488' check (whatsapp_number ~ '^[0-9]{8,15}$'),
  email text not null default 'almawizah@gmail.com' check (length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  facebook_url text not null default 'https://www.facebook.com/AlMawizah' check (facebook_url = '' or facebook_url ~* '^https://[^[:space:]]+$'),
  instagram_url text not null default 'https://www.instagram.com/al_maw_izah/' check (instagram_url = '' or instagram_url ~* '^https://[^[:space:]]+$'),
  address text not null default '' check (length(address) <= 500),
  logo_url text not null default 'assets/al-mawizah-logo.jpg' check (length(logo_url) <= 2048 and (logo_url ~ '^assets/[a-zA-Z0-9._/-]+$' or logo_url ~* '^https://[^[:space:]]+$')),
  hero_title_en text not null default 'A scent that stays with you.' check(length(hero_title_en) between 1 and 200),
  hero_title_bn text not null default 'সুবাস, যা আপনার সঙ্গে থাকে।' check(length(hero_title_bn) between 1 and 200),
  hero_text_en text not null default 'Discover perfume and attar selected for your everyday rituals and special moments.' check(length(hero_text_en) <= 500),
  hero_text_bn text not null default 'প্রতিদিনের অভ্যাস ও বিশেষ মুহূর্তের জন্য পারফিউম ও আতরের সংগ্রহ আবিষ্কার করুন।' check(length(hero_text_bn) <= 500),
  story_title_en text not null default 'A little luxury, every day.' check(length(story_title_en) between 1 and 200),
  story_title_bn text not null default 'প্রতিদিনের ছোট্ট এক বিলাসিতা।' check(length(story_title_bn) between 1 and 200),
  story_text_en text not null default 'Fragrance is personal. Let us help you find one that feels like you.' check(length(story_text_en) <= 500),
  story_text_bn text not null default 'সুবাস ব্যক্তিগত। আপনার পছন্দের সুবাস খুঁজে পেতে আমরা পাশে আছি।' check(length(story_text_bn) <= 500),
  tagline_en text not null default 'A fragrance for every moment.' check(length(tagline_en) <= 200),
  tagline_bn text not null default 'প্রতিটি মুহূর্তের জন্য সুবাস।' check(length(tagline_bn) <= 200),
  delivery_note_en text not null default 'Cash on delivery. Delivery charge and availability will be confirmed with you.' check(length(delivery_note_en) <= 500),
  delivery_note_bn text not null default 'ক্যাশ অন ডেলিভারি। ডেলিভারি চার্জ ও পণ্যের প্রাপ্যতা আপনার সঙ্গে নিশ্চিত করা হবে।' check(length(delivery_note_bn) <= 500)
);
alter table public.store_settings enable row level security;
revoke all on public.store_settings from anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
drop policy if exists "Everyone reads store settings" on public.store_settings;
create policy "Everyone reads store settings" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins update store settings" on public.store_settings;
create policy "Admins update store settings" on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.store_settings(id) values (1) on conflict (id) do nothing;
commit;
