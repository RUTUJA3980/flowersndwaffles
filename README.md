# Flowers Flowers & Waffles Waffle 🌸🧇

E-commerce website for flowers and waffles using HTML/CSS/JavaScript, Node.js, Express and MongoDB.

## Setup

1. Install Node.js.
2. Copy `.env.example` to `.env`.
3. Fill in the real values in `.env`.
4. Install dependencies:

```bash
npm install
```

5. Start the server:

```bash
npm start
```

6. Open `http://localhost:7000/landing.html`.

## Seed products

After setting `MONGO_URI`, run:

```bash
node seed.js
```

## GitHub safety

Never commit `.env`, `node_modules/`, or log files. `.env.example` is safe to commit because it contains placeholders only.

## Project structure

- `server.js` — Express server and API routes
- `models/` — MongoDB/Mongoose models
- `*.html`, `*.css`, `*.js` — storefront and customer/admin pages
- `images/` — product images
- `.env.example` — environment-variable template (safe to commit)

## Notes

This is a demo/academic e-commerce project. Admin authorization is environment-variable based; for production, add proper sessions/JWT, authorization middleware, validation, rate limiting, and secure logging.
