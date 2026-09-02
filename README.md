# GME Alliance Reservation API

API REST desarrollada con **NestJS** y **TypeORM** para la gestión de reservas de recursos (como salas de conferencias). El sistema permite la gestión de usuarios, la creación de recursos, la reserva de dichos recursos en rangos de tiempo específicos y la validación de conflictos de horarios.

## 📑 Tabla de Contenidos
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [🚀 Requisitos Previos](#-requisitos-previos)
- [⚙️ Instalación y Ejecución](#️-instalación-y-ejecución)
- [🔄 Flujo de Trabajo (Workflow)](#-flujo-de-trabajo-workflow)
- [🔗 Endpoints Principales](#-endpoints-principales)
- [🧪 Testing](#-testing)
- [⚠️ Manejo de Errores y Conflictos](#️-manejo-de-errores-y-conflictos)

---

## ✨ Características Principales
- **Gestión de Usuarios:** Creación de usuarios con `id` UUID, `email` único y `name`.
- **Gestión de Recursos:** Creación de recursos físicos (ej. salas) con `name`, `type`, `capacity` y estado `isActive`.
- **Sistema de Reservas:** 
  - Creación de reservas con estado inicial `pending`.
  - Confirmación de reservas cambiando el estado a `confirmed`.
  - Validación de disponibilidad para evitar solapamientos de horarios (conflictos 409).
  - Consulta de disponibilidad de un recurso en un rango de fechas específico.
- **Filtrado y Paginación:** Búsqueda de reservas filtradas por `resourceId` y `status`, con soporte de paginación (`page`, `limit`).

---

## 🛠 Stack Tecnológico
- **Lenguaje:** TypeScript
- **Framework:** NestJS (Node.js)
- **ORM:** TypeORM
- **Base de Datos:** PostgreSQL (o SQLite para pruebas)
- **Testing:** Jest + Supertest

---

## 📂 Estructura del Proyecto

src/
├── config/
├── database/
├── modules/
│   ├── reservations/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── reservations.controller.ts
│   │   ├── reservations.module.ts
│   │   └── reservations.service.ts
│   ├── resources/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── resources.controller.ts
│   │   ├── resources.module.ts
│   │   └── resources.service.ts
│   └── users/
│       ├── dto/
│       ├── entities/
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── app.controller.ts
├── app.module.ts
└── main.ts

test/
├── setup-e2e.ts
└── utils/

---

## 🚀 Requisitos Previos
- Node.js (v18 o superior)
- npm o yarn
- Docker (Opcional, si se usa docker-compose.yml para la BD)

---

## ⚙️ Instalación y Ejecución

1. **Clonar el repositorio e instalar dependencias:**

   git clone <url-del-repositorio>
   cd gme-alliance-reservation-api
   npm install

2. **Configurar variables de entorno:** Crea un archivo `.env` en la raíz basado en `.env.example` y configura la conexión a tu base de datos.

3. **Levantar la base de datos (Opcional, vía Docker):**

   docker-compose up -d

4. **Ejecutar la aplicación en modo desarrollo:**

   npm run start:dev

   La API estará disponible en http://localhost:3000.

---

## 🔄 Flujo de Trabajo (Workflow)
El flujo estándar para crear una reserva exitosa es el siguiente:

1. **Crear un Usuario:** `POST /users` (Obtienes un `userId`).
2. **Crear un Recurso:** `POST /resources` (Obtienes un `resourceId`).
3. **Crear una Reserva:** `POST /reservations` (Estado inicial: `pending`).
4. **Confirmar la Reserva:** `PUT /reservations/:id` (Cambia el estado a `confirmed`).
5. **Verificar Disponibilidad:** `GET /reservations/:resourceId/availability` (Comprueba si está libre).

---

## 🔗 Endpoints Principales

| Método | Endpoint | Descripción | Códigos de Éxito | Códigos de Error |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/users` | Crea un nuevo usuario. | `201 Created` | `400` (Validación) |
| `POST` | `/resources` | Crea un nuevo recurso (sala, etc.). | `201 Created` | `400` (Validación) |
| `POST` | `/reservations` | Crea una reserva (estado `pending`). | `201 Created` | `400`, `409 Conflict` |
| `PUT` | `/reservations/:id` | Actualiza el estado de una reserva (ej. `confirmed`). | `200 OK` | `404`, `409` |
| `GET` | `/reservations` | Lista reservas (soporta filtros y paginación). | `200 OK` | - |
| `GET` | `/reservations/:resourceId/availability` | Verifica disponibilidad de un recurso. | `200 OK` | `400` |

---

## 🧪 Testing

El proyecto incluye una estrategia completa de pruebas que cubren la lógica de negocio aislada (unitarias) y el flujo HTTP completo con la base de datos (E2E/Integración).

### Pruebas Unitarias
Validan la lógica de los servicios y controladores de forma aislada, utilizando **mocks** de los repositorios.

   npm run test

### Pruebas E2E / Integración
Validan los endpoints reales levantando la aplicación completa, conectando a una base de datos de prueba (con `synchronize: true` para crear las tablas automáticamente) y verificando las respuestas HTTP exactas (incluyendo los conflictos de horarios y la paginación).

   npm run test:e2e

### Plan de Archivos de Testing
*(Basado en la arquitectura del proyecto)*

**Configuración Global (carpeta `test/`):**
1. `test/setup-e2e.ts` (Configuración de la app y BD para pruebas).
2. `test/utils/test-helpers.ts` (Funciones reutilizables para crear datos de prueba).

**Módulo de Usuarios (`src/modules/users/`):**
3. `users.service.spec.ts`
4. `users.controller.spec.ts`
5. `users.e2e-spec.ts`

**Módulo de Recursos (`src/modules/resources/`):**
6. `resources.service.spec.ts`
7. `resources.controller.spec.ts`
8. `resources.e2e-spec.ts`

**Módulo de Reservas (`src/modules/reservations/`):**
9. `reservations.service.spec.ts`
10. `reservations.controller.spec.ts`
11. `reservations.e2e-spec.ts`
12. `availability.e2e-spec.ts`

---

## ⚠️ Manejo de Errores y Conflictos

Uno de los aspectos fundamentales del sistema es la prevención de dobles reservas. El endpoint `POST /reservations` valida los rangos de tiempo.

Si un recurso ya está reservado en el rango de fechas solicitado, la API responde con un error `409 Conflict`:

{
  "message": "Resource \"[resourceId]\" is already reserved for the requested time range.",
  "error": "Conflict",
  "statusCode": 409
}

Este comportamiento es crucial para garantizar la integridad de los datos y ha sido validado exhaustivamente en la suite de pruebas automatizadas.
