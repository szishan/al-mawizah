-- Add editable text without changing the existing settings.
begin;
alter table public.store_settings
  add column if not exists story_title_en text not null default 'A little luxury, every day.' check(length(story_title_en) between 1 and 200),
  add column if not exists story_title_bn text not null default 'প্রতিদিনের ছোট্ট এক বিলাসিতা।' check(length(story_title_bn) between 1 and 200),
  add column if not exists story_text_en text not null default 'Fragrance is personal. Let us help you find one that feels like you.' check(length(story_text_en) <= 500),
  add column if not exists story_text_bn text not null default 'সুবাস ব্যক্তিগত। আপনার পছন্দের সুবাস খুঁজে পেতে আমরা পাশে আছি।' check(length(story_text_bn) <= 500),
  add column if not exists tagline_en text not null default 'A fragrance for every moment.' check(length(tagline_en) <= 200),
  add column if not exists tagline_bn text not null default 'প্রতিটি মুহূর্তের জন্য সুবাস।' check(length(tagline_bn) <= 200);
commit;
