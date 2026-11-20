import { Navigate, Route, Routes } from "react-router-dom";
import { DatosProvider } from "@/datos/contexto";
import { Acceso } from "@/pages/Acceso";
import { AltaEquipo } from "@/pages/AltaEquipo";
import { DetalleOrden } from "@/pages/DetalleOrden";
import { FichaEquipo } from "@/pages/FichaEquipo";
import { Mesa } from "@/pages/Mesa";
import { Marco } from "@/ui/Marco";

export default function App() {
  return (
    <DatosProvider>
      <Routes>
        <Route path="/acceso" element={<Acceso />} />
        <Route element={<Marco />}>
          <Route path="/" element={<Mesa />} />
          <Route path="/equipos/nuevo" element={<AltaEquipo />} />
          <Route path="/equipos/:id" element={<FichaEquipo />} />
          <Route path="/ordenes/:id" element={<DetalleOrden />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DatosProvider>
  );
}
