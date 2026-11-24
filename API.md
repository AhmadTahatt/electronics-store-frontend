# API contract (what the Angular app calls)

Base URL: `/api` (proxied to the ASP.NET backend by `proxy.conf.json` — edit the port there).
Switch from sample data to the real API: `src/environments/environment.ts` → `useMockData: false`.

| Used by | Method + URL | Body / query | Returns |
|---|---|---|---|
| Login | `POST /api/auth/login` | `{ username, password }` | `{ token, username, role, expiresAt }` (401 if wrong) |
| Register | `POST /api/auth/register` | `{ fullName, email, username, password }` | 200/201 (400 + message if username/email exists) |
| Home | `GET /api/products/featured` | – | `Product[]` |
| Home | `GET /api/products/new-arrivals` | – | `Product[]` |
| Home | `GET /api/products/best-sellers` | – | `Product[]` |
| Home, filters | `GET /api/categories` | – | `{ id, name }[]` |
| Home, filters | `GET /api/brands` | – | `{ id, name }[]` |
| Products page | `GET /api/products` | `?search&category&brand&minPrice&maxPrice&inStock&sort` | `Product[]` |
| Details page | `GET /api/products/{id}` | – | `Product` |
| Checkout (later) | `POST /api/orders` | name, phone, address, items `[{productId, quantity}]` | order number |
| Admin pages | everything under `/api/admin/...` | `Authorization: Bearer <token>` | needs `[Authorize(Roles = "Admin")]` |

`Product` JSON (camelCase — ASP.NET does this by default):
`{ id, name, category, brand, price, stock, image, description, rating?, warrantyMonths?, isFeatured, isNew, isBestSeller }`

Backend must: enable CORS only if you don't use the proxy, return `role: "Admin"` for admins,
hash passwords, and re-check stock when the order is created.
