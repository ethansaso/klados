# Klados

![CI](https://github.com/ethansaso/klados/actions/workflows/ci.yml/badge.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

[https://klados.bio](klados.bio)

Klados is a web platform for learning to identify organisms through collaborative visual guides that model relationships across biological taxonomy.

Klados focuses on explicit structure through a glossary of characters and related concepts, and relationships that can be learned, discussed, improved, and reused by others.

## Development setup

<details>
<summary><strong>Instructions</strong></summary>

These instructions are a starting point and may change as the project evolves.

### Prerequisites

- Node.js (LTS recommended)
- A package manager (npm / pnpm / yarn)
- Docker (for local Postgres)

### Clone the repository

```sh
git clone https://github.com/ethansaso/klados.git
cd klados
```

### Install dependencies

```sh
npm install
```

### Configure environment variables

Create a .env file in the project root:

```env
DATABASE_URL=postgres://app:app@localhost:5434/taxokeys
BETTER_AUTH_SECRET=<your secret here>
BETTER_AUTH_URL=http://localhost:3000
VITE_SITE_URL=http://localhost:3000
```

### Set up the database

```sh
docker compose up -d
npm run db:migrate
npm run db:seed
```

### Run the development server

```sh
npm run dev
```

</details>

## Acknowledgements

Klados builds on and links to resources from the broader community science ecosystem.

In particular, the project links to and references data and media from:

- **GBIF (Global Biodiversity Information Facility)** - https://www.gbif.org
- **iNaturalist** - https://www.inaturalist.org

The application stores structured descriptions, identifiers, and limited metadata (such as names and IDs from iNaturalist and GBIF) to support cross-referencing, navigation, and attribution.

Media displayed in Klados is sourced from external providers and shown with visible attribution to the original creators and licensors. Images are not hosted directly by the application.

We are grateful to the researchers, institutions, and community contributors who make these resources publicly available.

## License

This project is currently distributed without an open-source license.
All rights reserved unless otherwise stated.
