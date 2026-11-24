-- Migration 002: extend catalog while keeping existing products and image URLs intact.
-- Run once in a transaction in the Supabase SQL editor. No service-role key belongs in the client.
begin;
alter table public.products
  add column if not exists brand text,
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists concentration text,
  add column if not exists gender text,
  add column if not exists country_of_origin text,
  add column if not exists manufacturer text,
  add column if not exists release_year integer,
  add column if not exists fragrance_types text[] not null default '{}',
  add column if not exists top_notes text,
  add column if not exists heart_notes text,
  add column if not exists base_notes text,
  add column if not exists accords text,
  add column if not exists longevity text,
  add column if not exists projection text,
  add column if not exists sillage text,
  add column if not exists season text,
  add column if not exists occasion text,
  add column if not exists day_night text,
  add column if not exists highlights text,
  add column if not exists how_to_use text,
  add column if not exists storage_instructions text,
  add column if not exists ingredients text,
  add column if not exists packaging text,
  add column if not exists authenticity text,
  add column if not exists attar_type text,
  add column if not exists alcohol_free text,
  add column if not exists oil_based boolean,
  add column if not exists bottle_type text,
  add column if not exists bottle_material text,
  add column if not exists intensity text,
  add column if not exists video_url text,
  add column if not exists stock_quantity integer,
  add column if not exists stock_status text,
  add column if not exists low_stock_threshold integer,
  add column if not exists featured boolean not null default false,
  add column if not exists new_arrival boolean not null default false,
  add column if not exists best_seller boolean not null default false,
  add column if not exists product_status text,
  add column if not exists sale_price_bdt numeric(12,2);

-- Legacy flags remain usable by the existing storefront and admin.
update public.products set product_status = case when published then 'published' else 'draft' end where product_status is null;
update public.products set stock_status = case when in_stock then 'in_stock' else 'out_of_stock' end where stock_status is null;
alter table public.products alter column product_status set default 'draft', alter column product_status set not null,
  alter column stock_status set default 'out_of_stock', alter column stock_status set not null;
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (category in ('perfume','attar','perfume_oil','gift_set','decant'));
alter table public.products drop constraint if exists products_expanded_validation;
alter table public.products add constraint products_expanded_validation check (
  product_status in ('draft','published','archived') and stock_status in ('in_stock','out_of_stock','pre_order')
  and (stock_quantity is null or stock_quantity >= 0) and (low_stock_threshold is null or low_stock_threshold >= 0)
  and (sale_price_bdt is null or sale_price_bdt >= 0)
  and (sale_price_bdt is null or price_bdt is null or sale_price_bdt <= price_bdt)
  and (release_year is null or release_year between 1800 and 2100)
  and (gender is null or gender in ('men','women','unisex'))
  and (alcohol_free is null or alcohol_free in ('verified','not_specified'))
  and (video_url is null or video_url = '' or video_url ~* '^https?://')
);
create unique index if not exists products_sku_unique on public.products (lower(sku)) where sku is not null and btrim(sku) <> '';

create or replace function public.sync_product_legacy_flags() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.published then new.product_status := 'published'; elsif new.product_status = 'published' then new.published := true; end if;
    if new.in_stock then new.stock_status := 'in_stock'; elsif new.stock_status = 'in_stock' then new.in_stock := true; end if;
  else
    if new.product_status is distinct from old.product_status then new.published := (new.product_status = 'published');
    elsif new.published is distinct from old.published then new.product_status := case when new.published then 'published' else 'draft' end; end if;
    if new.stock_status is distinct from old.stock_status then new.in_stock := (new.stock_status = 'in_stock');
    elsif new.in_stock is distinct from old.in_stock then new.stock_status := case when new.in_stock then 'in_stock' else 'out_of_stock' end; end if;
  end if;
  return new;
end $$;
drop trigger if exists products_sync_legacy_flags on public.products;
create trigger products_sync_legacy_flags before insert or update on public.products for each row execute function public.sync_product_legacy_flags();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (url ~* '^https?://'),
  alt_text text not null default '',
  position integer not null default 0 check(position >= 0),
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_order on public.product_images(product_id,position);
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (length(btrim(size)) between 1 and 100),
  sku text,
  price_bdt numeric(12,2) check (price_bdt is null or price_bdt >= 0),
  sale_price_bdt numeric(12,2) check (sale_price_bdt is null or (sale_price_bdt >= 0 and (price_bdt is null or sale_price_bdt <= price_bdt))),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  stock_status text not null default 'out_of_stock' check (stock_status in ('in_stock','out_of_stock','pre_order')),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
create index if not exists product_variants_product_order on public.product_variants(product_id,position);
create unique index if not exists product_variants_sku_unique on public.product_variants(lower(sku)) where sku is not null and btrim(sku) <> '';
-- Costs must never reside in the anonymously readable products or variants table.
create table if not exists public.product_private (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_bdt numeric(12,2) check (cost_bdt is null or cost_bdt >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_private enable row level security;
revoke all on public.product_private from anon, authenticated;
grant select,insert,update,delete on public.product_private to authenticated;
grant select on public.product_images,public.product_variants to anon,authenticated;
grant insert,update,delete on public.product_images,public.product_variants to authenticated;

drop policy if exists "Public reads published product images" on public.product_images;
create policy "Public reads published product images" on public.product_images for select to anon,authenticated using (exists (select 1 from public.products p where p.id=product_id and p.published));
drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public reads published product variants" on public.product_variants;
create policy "Public reads published product variants" on public.product_variants for select to anon,authenticated using (exists (select 1 from public.products p where p.id=product_id and p.published));
drop policy if exists "Admins manage product variants" on public.product_variants;
create policy "Admins manage product variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage private product data" on public.product_private;
create policy "Admins manage private product data" on public.product_private for all to authenticated using (public.is_admin()) with check (public.is_admin());
commit;
