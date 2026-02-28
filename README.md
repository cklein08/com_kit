# com_kit

Next.js app with Adobe Experience Manager (AEM) headless and Adobe Commerce integration.

## Stack

- **Next.js** 16 (App Router)
- **React** 19
- **AEM Headless** (`@adobe/aem-headless-client-js`)
- **Adobe Commerce** (Commerce Optimizer GraphQL)
- **Tailwind CSS**, **Radix UI**, **shadcn-style** components

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:

   - **Commerce**: `NEXT_PUBLIC_COMMERCE_OPTIMIZER_URL`, `NEXT_PUBLIC_CATALOG_VIEW_ID`
   - **Auth (Sign in with Adobe, same as AEM author)**: `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET`, `AUTH_SECRET` (or `ADOBE_SESSION_SECRET`). Optional: `ADOBE_IMS_ORG_ID` to scope sign-in to an org.
   - Optional: content source (AEM, da.live, Amplience) and related vars

3. **Run locally**

   ```bash
   npm run dev
   ```

   App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start dev server                      |
| `npm run build` | Production build                     |
| `npm run start` | Start production server              |
| `npm run lint`  | Run ESLint                           |

## Repo and branch

- **Remote:** https://github.com/cklein08/com_kit.git  
- **Starting branch:** `init`  

Push (from repo root, one level up from this folder):

```bash
git push -u origin init
```

## License

Private.
