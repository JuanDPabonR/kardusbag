# 🛍️ KardusBag Platform

Plataforma de E-Commerce moderna y escalable basada en una arquitectura **Monorepo (Nx)**, **Clean Architecture (DDD / Hexagonal)** y un stack completo de **Observabilidad y Microservicios**.

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estructura del Monorepo](#-estructura-del-monorepo)
- [Requisitos Previos](#-requisitos-previos)
- [Variables de Entorno](#-variables-de-entorno)
- [Puesta en Marcha](#-puesta-en-marcha)
  - [1. Infraestructura con Docker](#1-infraestructura-con-docker)
  - [2. Base de Datos y Migraciones](#2-base-de-datos-y-migraciones)
  - [3. Ejecución de las Aplicaciones](#3-ejecución-de-las-aplicaciones)
- [Observabilidad y Monitoreo](#-observabilidad-y-monitoreo)
- [Autenticación y Seguridad](#-autenticación-y-seguridad)
- [Scripts Disponibles](#-scripts-disponibles)

---

## ✨ Características Principales

- 🏗️ **Monorepo con Nx**: Gestión eficiente de múltiples aplicaciones y bibliotecas compartidas.
- 📐 **Clean Architecture & DDD**: Separación estricta de responsabilidades (Domain, Application, Infrastructure).
- 🗄️ **Drizzle ORM & PostgreSQL**: Modelado de datos tipado en TypeScript y migraciones automatizadas.
- 📊 **Full Observability Suite**: Trazabilidad distribuida (Tempo / OpenTelemetry), Métricas (Prometheus), Logs estructurados (Pino + Loki) y Paneles (Grafana).
- 🚦 **Load Balancer & Reverse Proxy**: Enrutamiento y balanceo de carga mediante Traefik.
- 🔐 **Autenticación con Clerk**: Control de acceso granular, guards globales y decoradores `@Public()`.

---

## 🛠️ Stack Tecnológico

| Capa                            | Tecnología                                                                                                                              |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Engine**             | [Nx](https://nx.dev/) 23                                                                                                                |
| **Backend Framework**           | [NestJS](https://nestjs.com/) 11 (Express)                                                                                              |
| **Lenguaje**                    | [TypeScript](https://www.typescriptlang.org/) ~6.0 & [SWC](https://swc.rs/)                                                             |
| **Base de Datos**               | [PostgreSQL](https://www.postgresql.org/) 16 + [Drizzle ORM](https://orm.drizzle.team/)                                                 |
| **Autenticación**               | [Clerk](https://clerk.com/) (`@clerk/backend`)                                                                                          |
| **Proxy Inverso / Balanceador** | [Traefik](https://traefik.io/) v3.1                                                                                                     |
| **Logging**                     | [Pino](https://getpino.io/) + `pino-http` + `pino-loki`                                                                                 |
| **Métricas**                    | [Prometheus](https://prometheus.io/) (`@willsoto/nestjs-prometheus`)                                                                    |
| **Trazas Distribuidas**         | [Grafana Tempo](https://grafana.com/oss/tempo/) + OpenTelemetry SDK Node                                                                |
| **Dashboards**                  | [Grafana](https://grafana.com/)                                                                                                         |
| **Testing & Calidad**           | [Jest](https://jestjs.io/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/) |

---

## 🏛️ Arquitectura del Proyecto

El proyecto implementa los principios de **Clean Architecture** (Arquitectura Hexagonal / Puertos y Adaptadores) combinados con **Domain-Driven Design (DDD)**:

```mermaid
graph TD
    App[apps/kardusbag - Controllers / Entrypoint] --> Application[libs/domains/bag/application - Use Cases & DTOs]
    Application --> Domain[libs/domains/bag/domain - Entities & Repository Ports]
    Infrastructure[libs/domains/bag/infrastructure - Drizzle Repositories] -. Implements .-> Domain
    Infrastructure --> DB[libs/database - Drizzle Schemas & Client]
    App --> Shared[libs/shared - Auth Guards & Filters]
```

- **Domain Layer (`domain`)**: Entidades de negocio, Value Objects e interfaces de repositorios (puertos). No depende de ningún framework ni base de datos.
- **Application Layer (`application`)**: Casos de uso (Use Cases) y DTOs de entrada/salida que orquestan las operaciones de negocio.
- **Infrastructure Layer (`infrastructure`)**: Adaptadores secundarios (implementación de repositorios con Drizzle ORM, clientes de bases de datos, integraciones externas).
- **Presentation / API Layer (`apps/kardusbag`)**: Controladores HTTP NestJS, Pipes de validación, filtros de excepciones globales y guards.

---

## 📂 Estructura del Monorepo

```plaintext
kardusbag/
├── apps/
│   ├── kardusbag/            # API principal de KardusBag (E-Commerce)
│   │   └── src/
│   │       ├── app/          # Módulos, controladores y DTOs de transporte
│   │       ├── tracing.ts    # Inicialización de OpenTelemetry
│   │       └── main.ts       # Bootstrap de NestJS con ValidationPipe y Pino
│   └── admin-api/            # API administrativa / backoffice
│
├── libs/
│   ├── core/                 # Utilidades y abstracciones núcleo del dominio
│   ├── database/             # Modelos Drizzle ORM, conexiones y migraciones SQL
│   │   ├── migrations/       # Migraciones generadas por Drizzle Kit
│   │   └── src/schema/       # Definición de tablas y relaciones (22 tablas)
│   ├── domains/
│   │   └── bag/              # Dominio de Bolsos/Productos (Clean Architecture)
│   │       ├── application/  # Use Cases (CreateBag, GetBagById, etc.)
│   │       ├── domain/       # Entidades e interfaces del repositorio
│   │       └── infrastructure/ # Implementación con Drizzle
│   ├── infra/                # Configuraciones de observabilidad y Dockerfiles
│   │   ├── docker/           # Dockerfiles para despliegue de contenedores
│   │   └── monitoring/       # Configs de Prometheus, Tempo y Loki
│   └── shared/               # Filtros globales, guards de Clerk, decoradores
│
├── docker-compose.yml        # Stack completo de contenedores
├── drizzle.config.ts         # Configuración de migraciones Drizzle
└── package.json              # Dependencias y scripts del proyecto
```

---

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) `>= 20.x`
- [pnpm](https://pnpm.io/) `>= 10.x`
- [Docker](https://www.docker.com/) & Docker Compose

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basado en el siguiente ejemplo:

```bash
# BASE DE DATOS
DATABASE_URL="postgresql://user:password@localhost:5432/platform_db"

# OBSERVABILIDAD / MÉTRICAS
PORT=3000
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"

# AUTENTICACIÓN (CLERK)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 🚀 Puesta en Marcha

### 1. Infraestructura con Docker

Levanta la base de datos y toda la suite de observabilidad:

```bash
docker compose up -d postgres prometheus tempo loki grafana traefik
```

### 2. Base de Datos y Migraciones

Genera y ejecuta las migraciones de PostgreSQL con Drizzle ORM:

```bash
# 1. Generar migración SQL a partir de los esquemas en libs/database/src/schema/
pnpm db:generate

# 2. Aplicar las migraciones a la base de datos activa
pnpm db:migrate

# 3. (Opcional) Abrir interfaz gráfica para explorar la base de datos
pnpm db:studio
```

### 3. Ejecución de las Aplicaciones

Instala las dependencias y corre el servidor en modo desarrollo:

```bash
# Instalar paquetes
pnpm install

# Iniciar la API principal con recarga en caliente
pnpm start:dev
# o directamente vía Nx:
# npx nx serve kardusbag
```

La API estará disponible en: `http://localhost:3000/api`

---

## 📊 Observabilidad y Monitoreo

El entorno de desarrollo incluye integración completa de observabilidad lista para usar:

| Servicio                | URL Local                                                              | Descripción / Credenciales                         |
| :---------------------- | :--------------------------------------------------------------------- | :------------------------------------------------- |
| **API Principal**       | [http://localhost:3000/api](http://localhost:3000/api)                 | Endpoint base de la aplicación                     |
| **Métricas Prometheus** | [http://localhost:3000/api/metrics](http://localhost:3000/api/metrics) | Métricas expuestas en formato OpenMetrics          |
| **Prometheus Server**   | [http://localhost:9090](http://localhost:9090)                         | Servidor de scraping de métricas                   |
| **Grafana UI**          | [http://localhost:3001](http://localhost:3001)                         | Dashboard de métricas y trazas (`admin` / `admin`) |
| **Grafana Tempo**       | [http://localhost:4318](http://localhost:4318)                         | Receptor OTLP HTTP de trazas distribuidas          |
| **Grafana Loki**        | [http://localhost:3100](http://localhost:3100)                         | Agregador y receptor de logs                       |
| **Traefik Dashboard**   | [http://localhost:8080](http://localhost:8080)                         | Panel de control de rutas y balanceador            |
| **Drizzle Studio**      | [http://localhost:3003](http://localhost:3003)                         | GUI visualizador de PostgreSQL                     |

---

## 🔑 Autenticación y Seguridad

- Las rutas de la API están protegidas por defecto mediante el `ClerkAuthGuard`.
- Para marcar endpoints como públicos se utiliza el decorador `@Public()`.
- Para generar un token de desarrollo de 30 días para pruebas en herramientas como Postman, Thunder Client o cURL:

```bash
node generar-bearer.js
```

Incluye el encabezado HTTP en tus peticiones:

```http
Authorization: Bearer <TU_TOKEN>
```

---

## 📦 Scripts Disponibles

En `package.json` encontrarás los comandos listos para el ciclo de vida de desarrollo:

- `pnpm start:dev`: Levanta la aplicación `kardusbag` en modo desarrollo con SWC y watch mode.
- `pnpm db:generate`: Genera los archivos de migración SQL basados en los esquemas de Drizzle.
- `pnpm db:migrate`: Aplica las migraciones pendientes en PostgreSQL.
- `pnpm db:studio`: Inicia Drizzle Studio en el puerto 3003.
- `pnpm test:cov`: Ejecuta las pruebas unitarias y genera reporte de cobertura `lcov`.
- `pnpm prepare`: Configura los hooks de Husky para Git.
