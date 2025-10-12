import { db } from "./db";
import { users, clientes, vehiculos } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      email: "admin@dmstaller.com",
      password: hashedPassword,
      nombre: "Administrador",
      apellidos: "Sistema",
      rol: "admin",
      activo: true,
    })
    .returning()
    .catch(() => {
      console.log("Usuario admin ya existe, saltando...");
      return [];
    });

  if (adminUser) {
    console.log("✅ Usuario admin creado");
  }

  // Create demo client
  const [cliente1] = await db
    .insert(clientes)
    .values({
      tipo: "particular",
      nif: "12345678A",
      nombre: "Juan",
      apellidos: "García Pérez",
      email: "juan.garcia@example.com",
      movil: "666777888",
      direccion: "Calle Principal 123",
      codigoPostal: "35001",
      ciudad: "Las Palmas de Gran Canaria",
      provincia: "Las Palmas",
      rgpdConsentimiento: true,
    })
    .returning()
    .catch(() => {
      console.log("Cliente demo ya existe, saltando...");
      return [];
    });

  if (cliente1) {
    console.log("✅ Cliente demo creado");

    // Create vehicle for demo client
    await db
      .insert(vehiculos)
      .values({
        clienteId: cliente1.id,
        matricula: "1234ABC",
        vin: "WBADT43452G123456",
        marca: "Toyota",
        modelo: "Corolla",
        version: "1.8 Hybrid",
        año: 2021,
        combustible: "Híbrido",
        km: 45000,
        color: "Gris",
      })
      .catch(() => {
        console.log("Vehículo demo ya existe, saltando...");
      });

    console.log("✅ Vehículo demo creado");
  }

  console.log("✨ Seeding completado!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding:", error);
  process.exit(1);
});
