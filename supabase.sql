-- Run in Supabase SQL editor, then add the owner's Auth user ID to admin_users.
create extension if not exists pgcrypto;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;
-- No client access to this table. The security-definer function checks membership.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create table public.products (id uuid primary key default gen_random_uuid(), name_en text not null check(length(name_en) between 1 and 200), name_bn text default '', category text not null check(category in ('perfume','attar')), size text default '', price_bdt numeric(12,2) check(price_bdt >= 0), description_en text default '', description_bn text default '', image_url text, in_stock boolean not null default false, published boolean not null default false, created_at timestamptz not null default now());
alter table public.products enable row level security;
create policy "Public reads published products" on public.products for select to anon, authenticated using (published = true);
create policy "Admins read all products" on public.products for select to authenticated using (public.is_admin());
create policy "Admins insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_admin());
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Public product images" on storage.objects for select to anon, authenticated using (bucket_id='product-images');
create policy "Admins upload images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_admin());
create policy "Admins delete images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_admin());
-- After creating your Auth user, run this with its UUID substituted:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
