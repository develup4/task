# Project Setup

This is a Next.js project with the following stack:

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Charts**: react-apexcharts
- **Diagrams**: @xyflow/react
- **Tree View**: @mui/x-tree-view
- **ORM**: Prisma
- **UI Components**: DaisyUI

## Project Structure

```
my-app/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── lib/             # Library files and utilities
│   └── prisma.ts    # Prisma client instance
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── prisma/          # Prisma schema and migrations
│   └── schema.prisma
└── public/          # Static assets
```

## Getting Started

1. Install dependencies (already done):
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update the DATABASE_URL in .env file with your database credentials

4. Run Prisma migrations:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma Client

## Installed Packages

### Dependencies
- next: ^15.5.6
- react: ^19.1.0
- react-dom: ^19.1.0
- typescript: ^5
- tailwindcss: ^4
- daisyui: ^5.3.7
- apexcharts: ^5.3.5
- react-apexcharts: ^1.8.0
- @xyflow/react: ^12.8.6
- @mui/x-tree-view: ^8.14.1
- @mui/material: ^7.3.4
- @emotion/react: ^11.14.0
- @emotion/styled: ^11.14.1
- prisma: ^6.17.1
- @prisma/client: ^6.17.1

## DaisyUI Themes

Available themes configured:
- light
- dark
- cupcake
- cyberpunk

To change theme, add `data-theme="dark"` to your HTML element.

## Notes

- Prisma client is configured in `lib/prisma.ts` for Next.js edge runtime
- Tailwind CSS and DaisyUI are configured in `tailwind.config.ts`
- PostCSS is configured in `postcss.config.mjs`
