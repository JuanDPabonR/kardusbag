import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { usersTable, rolesTable, customersTable } from '@kardusbag/database'; // Ajusta la ruta a tu esquema

@Injectable()
export class AuthSyncService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(@Inject('DRIZZLE_DB') private db: any) {}

  async syncCurrentUser(clerkId: string) {
    // 1. Verificar si el usuario ya existe en nuestra base de datos
    const existingUser = await this.db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (existingUser) {
      return {
        message: 'Usuario ya sincronizado',
        user: existingUser,
      };
    }

    // 2. Si no existe, obtener sus datos básicos (email, nombre) desde la API de Clerk
    const clerkUser = await this.clerk.users.getUser(clerkId);
    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    // 3. Buscar el rol por defecto ('customer')
    let defaultRole = await this.db.query.rolesTable.findFirst({
      where: eq(rolesTable.isDefault, true),
    });

    if (!defaultRole) {
      defaultRole = await this.db.query.rolesTable.findFirst({
        where: eq(rolesTable.name, 'customer'),
      });
    }

    if (!defaultRole) {
      throw new NotFoundException(
        "No se encontró el rol por defecto ('customer'). Ejecuta el seed de roles.",
      );
    }

    // 4. Crear el usuario en la BD de forma transaccional
    const [newUser] = await this.db
      .insert(usersTable)
      .values({
        clerkId,
        email: primaryEmail,
        roleId: defaultRole.id,
      })
      .returning();

    // 5. Crear su perfil de cliente asociado
    await this.db.insert(customersTable).values({
      userId: newUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName || 'Cliente',
      lastName: clerkUser.lastName || 'Kardus',
    });

    return {
      message: 'Usuario sincronizado y creado exitosamente',
      user: newUser,
    };
  }
}
