# DELIVERSO

Aplicación web de comercio electrónico para una marca premium de pastelería.

DELIVERSO = DELICIOSO + UNIVERSO

## Módulo 01

Este repositorio contiene la fundación del sistema: bootstrap, arquitectura base, internacionalización y sistema monetario.

No incluye catálogo, pagos, autenticación ni otras funcionalidades de negocio.

## Arranque local

```bash
pnpm install
pnpm dev
```

- Español (predeterminado): [http://localhost:3000](http://localhost:3000)
- Inglés: [http://localhost:3000/en](http://localhost:3000/en)

## Scripts

| Script | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript en modo strict |

## Documentación

- [Arquitectura](docs/architecture/README.md)
- [Decisiones](docs/adr)
- [Marca](docs/brand/README.md)
