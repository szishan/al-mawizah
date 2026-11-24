# Al Mawizah — setup and launch

This is a static GitHub Pages storefront with a Supabase-backed product editor. No products, prices, or stock are assumed. The site supports more than 100 products. Before launch, enter your own verified product names, permission-cleared images, selling prices and stock in Admin Studio.

## Supabase setup

1. Create a Supabase project. Run `supabase.sql` once in its SQL editor. The schema restricts product changes and image uploads to users listed in `admin_users`.
2. Create your administrator in Authentication > Users. Add the user's UUID to `admin_users` with the SQL statement shown at the end of `supabase.sql`. Disable public sign-ups in Auth settings unless needed. Use a strong password and secure your Supabase account.
3. In `config.js` enter the project URL and public publishable/anon key. These are intentionally public. Never put a service-role/secret key in the site or GitHub.
4. Sign in at `admin.html`. Add verified product details, mark stock only when confirmed, and publish when ready. A blank price is shown as contact for price. Uploads accept JPEG, PNG or WebP up to 5 MB. Editing a product's image URL removes or changes the displayed image; existing uploaded files remain in Storage until removed there.
5. Test access: signed-out visitors can read published products only; another authenticated user must not be able to edit products or upload images. Test the admin account separately. Set Supabase Auth redirect/site URL to the final Pages URL where appropriate.

## GitHub Pages

Create a NEW public repository named `al-mawizah` under `szishan`, upload the files in this folder to its root, and enable Settings > Pages > Deploy from a branch > `main` / root. The expected address is `https://szishan.github.io/al-mawizah/` once Pages deployment succeeds. A custom domain can be added later through Pages settings and DNS.

## Orders and limitations

The cart is stored in the visitor's browser. Checkout prepares a COD order in WhatsApp; it is sent only when the customer sends the message in WhatsApp. No orders are stored in Supabase, no payment is collected, and delivery charges and stock are confirmed manually. There is no separate on-site order submission. Uploaded images are public and replacing a product image does not delete old storage objects. Prices displayed in WhatsApp are a customer-side snapshot and must be reconfirmed. Protect customer information in WhatsApp and establish your own delivery, returns, and privacy policies before accepting orders. The storefront shows a contact message until Supabase is configured and products are published.

## Product management upgrade

For a project already using the original schema, apply `migrations/002_product_management.sql` once via the SQL editor before using the upgraded Studio. The migration preserves existing products and adds product details, ordered images, size variants and a separate administrator-only cost table. Never put cost data in the public products table. Uploaded product images are public; removing an image from a product removes its association, not the underlying stored object. The Studio keeps the session in the current browser tab and refreshes it when possible. Product records, images, variants, and cost are saved in separate requests; if a save reports an incomplete result, retry the same form before closing it. Checkout still sends a manually confirmed COD request through WhatsApp; it does not store an order or collect payment.
