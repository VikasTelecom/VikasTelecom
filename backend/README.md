# Backend API

Express + MongoDB backend for the VikasTelecom frontend.

## Setup
1. Create an `.env` file based on `.env.example`.
2. Install deps: `npm install`
3. Start dev server: `npm run dev`

## Base URL
`/api`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Products
- `GET /api/products`
- `GET /api/products/:idOrSlug`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

## Categories
- `GET /api/categories`
- `POST /api/categories` (admin)
- `PUT /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

## Orders
- `POST /api/orders` (user)
- `GET /api/orders/me` (user)
- `GET /api/orders` (admin)
- `PUT /api/orders/:id/status` (admin)

## Users (admin)
- `GET /api/users`
- `PUT /api/users/:id` (admin)
