# Eternal

Tienda de urnas biodegradables. Front en React y Back-End en Node.js con SQL Server.

Los productos que ves al empezar son de ejemplo. Se cambian desde el panel, en `/admin`.

## Cómo correrlo

1. SQL Server Express tiene que estar escuchando en `localhost,1433`.
2. En la carpeta del proyecto:

```bash
npm install
npm run db:setup
npm run dev
```

3. La tienda queda en http://localhost:5173 y la API en http://localhost:4000.

El email y la contraseña del panel están en `backend/.env` (`ADMIN_EMAIL` y `ADMIN_PASSWORD`). Ese archivo no se sube a GitHub.

## SQL Server Management Studio

Servidor: `localhost,1433`

- Autenticación de Windows, con tu usuario.
- O autenticación de SQL Server, usuario `sa`. La contraseña es `DB_ADMIN_PASSWORD` en `backend/.env`.

La base se llama `Eternal`.

## Pagos y asistente

- Mercado Pago: pegá el access token de prueba en `MP_ACCESS_TOKEN`. Sin eso, el pedido se reserva igual y el pago se marca a mano desde el panel.
- Asistente de ceremonia: con `OPENAI_API_KEY` usa el modelo. Sin la clave, sugiere a partir del texto con reglas locales.

## Repo

El remoto previsto es `VaniiB/eternal-urnas`, público, sin el archivo `.env`.
