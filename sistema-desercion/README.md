# Sistema de Detección Temprana de Riesgo de Deserción Escolar (Yura)

Sistema integral Offline-First, diseñado específicamente para zonas rurales y escuelas unidocentes. Construido en Angular 17+ y motor de base de datos Capacitor SQLite.

## Características Principales
- **100% Offline:** Arquitectura WebAssembly y SQLite nativo garantizan el funcionamiento total sin conexión a Internet.
- **Gestión Completa:** Estudiantes, Cursos, Asistencia Diaria y Calificaciones integradas en un modelo relacional.
- **Dashboard Estadístico:** Analítica de riesgo de deserción en tiempo real mediante heurísticas de rendimiento y faltas.
- **Responsive Design:** Optimizado estrictamente para Móvil, Tablet y Escritorio.
- **UI Profesional:** Estilos personalizados, modales asíncronos y sistema de notificaciones no-bloqueantes.

## Requisitos del Sistema
- [Node.js](https://nodejs.org/) (v20 o superior recomendado)
- NPM o Yarn

## Guía de Instalación (Entorno Web/Pruebas)

1. **Clonar e instalar dependencias:**
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`

2. **Ejecutar el servidor de desarrollo:**
   \`\`\`bash
   npx ng serve
   \`\`\`
   Abre \`http://localhost:4200/\` en tu navegador. 

## Instalación mediante Docker (Servidor Interno)

Si deseas hostear la versión Web del sistema (Offline-First en caché) dentro de una red de la escuela física sin necesidad de Node:

1. Ejecuta Docker Compose:
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`
2. Accede al sistema a través de \`http://<IP_DE_LA_MAQUINA>:8080/\`

## Guía de Empaquetado Nativo
Consulta el archivo \`CAPACITOR_GUIDE.md\` para las instrucciones paso a paso sobre cómo compilar este código en aplicaciones instalables para **Android (.apk)** y **Escritorio (.exe)**.
