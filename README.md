# Jarvis

Gestor de tareas por usuario con registro, inicio de sesión y tareas protegidas. Proyecto personal para practicar Next.js de punta a punta: interfaz, API, autenticación, base de datos y despliegue.

**Demo:** https://jarvis-azure-eta.vercel.app

## Qué hace

- Registro de usuarios con la contraseña hasheada con bcrypt.
- Inicio de sesión con JWT guardado en una cookie httpOnly, y cierre de sesión.
- Dashboard protegido: sin una sesión válida se redirige a `/login`.
- Tareas: listar, crear, marcar como completada y eliminar.
- Cada usuario ve y modifica solo sus propias tareas.

## Stack

Next.js 16 (App Router y Route Handlers), React 19, TypeScript, Prisma ORM, PostgreSQL, JWT (jsonwebtoken), bcryptjs, Tailwind CSS 4. Desplegado en Vercel.

## Decisiones técnicas

- **Cookie httpOnly en vez de localStorage.** El token viaja en una cookie `httpOnly`, `secure` en producción y `sameSite=lax`, con un día de vigencia. El JavaScript de la página no puede leerla, así que un script inyectado no puede robar la sesión.
- **La propiedad de cada tarea se valida en el servidor.** El `userId` sale del token firmado, nunca del cuerpo de la petición. Actualizar y eliminar filtran por `id` y `userId` a la vez; si la tarea es de otro usuario, la API responde 404.
- **Rutas protegidas antes de renderizar.** `proxy.ts` verifica el JWT en cada petición a `/dashboard` y redirige a `/login` si falta o no es válido, en vez de ocultar la página desde el cliente.
- **Prisma en Vercel.** El cliente de Prisma se genera en `postinstall`, para que exista en cada build de Vercel.

## API

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/register` | Crea un usuario |
| POST | `/api/auth/login` | Inicia sesión y fija la cookie |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/auth/me` | Devuelve el usuario de la sesión |
| GET | `/api/tasks` | Lista las tareas del usuario |
| POST | `/api/tasks` | Crea una tarea |
| PATCH | `/api/tasks/:id` | Marca una tarea como completada o pendiente |
| DELETE | `/api/tasks/:id` | Elimina una tarea |

## Cómo ejecutarlo en local

Requisitos: Node.js 20 o superior y una base de datos PostgreSQL.

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/danielgomez-engineer/jarvis.git
   cd jarvis
   npm install
   ```

2. Crea un archivo `.env` en la raíz con estas variables:

   ```
   DATABASE_URL="postgresql://USUARIO:CLAVE@localhost:5432/jarvis"
   JWT_SECRET="una-cadena-larga-y-aleatoria"
   ```

3. Aplica las migraciones y arranca el servidor:

   ```bash
   npx prisma migrate dev
   npm run dev
   ```

4. Abre http://localhost:3000.

## Estado

En desarrollo. Todavía no tiene pruebas automatizadas ni edición del título o la descripción de una tarea.
