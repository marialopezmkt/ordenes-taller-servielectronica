// Borra el caché de compilación de TypeScript y la carpeta dist.
// Sin esto, un build local puede dar verde mientras el servidor falla: TypeScript
// se saltea los archivos que cree sin cambios (node_modules/.tmp/*.tsbuildinfo).
import { rmSync } from "node:fs";

for (const carpeta of ["node_modules/.tmp", "dist"]) {
  rmSync(carpeta, { recursive: true, force: true });
}
console.log("Limpio: borrados node_modules/.tmp y dist.");
