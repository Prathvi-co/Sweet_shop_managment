# Sweet Shop Management
# Sweet Shop Management System

A simple full-stack demo app (Express backend + minimal frontend) for managing sweets.

## Repo layout
- backend/ — Express API
  - [backend/src/server.js](backend/src/server.js)
  - [backend/package.json](backend/package.json)
  - [backend/src/services/sweetservice.js] — service layer (`[`SweetService`](backend/src/services/sweetservice.js)`)
  - [backend/src/services/authservice.js] — auth helpers (`[`register`](backend/src/services/authservice.js)`, `[`login`](backend/src/services/authservice.js)`, `[`verifyToken`](backend/src/services/authservice.js)`)
  - [backend/src/data/inMemoryDB.js] — simple DB (`[`SweetRepository`](backend/src/data/inMemoryDB.js)`)
  - [backend/src/middleware/authmiddleware.js] — auth middlewares (`[`protect`](backend/src/middleware/authmiddleware.js)`, `[`admin`](backend/src/middleware/authmiddleware.js)`)
  - Controllers & routes: [backend/src/controllers/sweetcontroller.js](backend/src/controllers/sweetcontroller.js), [backend/src/controllers/authcontroller.js](backend/src/controllers/authcontroller.js), [backend/src/routes/sweetroutes.js](backend/src/routes/sweetroutes.js), [backend/src/routes/authroutes.js](backend/src/routes/authroutes.js)
  - Tests: [backend/__tests__/sweet.service.test.js](backend/__tests__/sweet.service.test.js)
- frontend/ — static UI
  - [frontend/index.html](frontend/index.html)
  - [frontend/src/App.jsx](frontend/src/App.jsx)

## Quick start (backend)
1. Install dependencies
```
cd backend
npm install
```
2. Run server
```
npm start
```
Default port: 3000 (configure via `PORT` env). Provide `JWT_SECRET` for production; defaults are present for development.

3. Run tests
```
npm test
```
Tests cover `[`SweetService`](backend/src/services/sweetservice.js)` behavior and use the in-memory DB ([backend/src/data/inMemoryDB.js](backend/src/data/inMemoryDB.js)).

## API overview
- Auth
  - POST /api/auth/register — register user (`[`register`](backend/src/services/authservice.js)`)
  - POST /api/auth/login — login and get JWT (`[`login`](backend/src/services/authservice.js)`)
- Sweets
  - GET /api/sweets — list all (`[`SweetService.findAllSweets`](backend/src/services/sweetservice.js)`)
  - GET /api/sweets/search?q=... — search
  - POST /api/sweets — create
  - PUT /api/sweets/:id — update
  - DELETE /api/sweets/:id — delete
  - POST /api/sweets/:id/purchase — purchase (decrements stock)
  - POST /api/sweets/:id/restock — restock

Protected routes should include `Authorization: Bearer <token>` header and are checked by `[`protect`](backend/src/middleware/authmiddleware.js)` / `[`admin`](backend/src/middleware/authmiddleware.js)`.

## Frontend
Open [frontend/index.html](frontend/index.html) for a static demo or run the React app entry [frontend/src/App.jsx](frontend/src/App.jsx). The frontend expects the API at `http://localhost:3000/api`.

## Notes
- This project uses an in-memory DB ([backend/src/data/inMemoryDB.js](backend/src/data/inMemoryDB.js)) — data resets on restart.
- For production, set a secure `JWT_SECRET` and replace in-memory storage with a persistent DB.
- See tests at [backend/__tests__/sweet.service.test.js](backend/__tests__/sweet.service.test.js) for expected behavior.
