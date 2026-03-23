# Guía de Compilación Nativa (CapacitorJS)

El sistema utiliza CapacitorJS para transformar el código base Angular en aplicaciones nativas con acceso real al disco del sistema (SQLite). El núcleo de Capacitor está pre-configurado, debes elegir inicializar los "moldes" nativos dependiendo de las computadoras objetivo.

## Regla de Oro (Flujo de Trabajo)
Siempre que realices una actualización en el código Angular (\`.ts\`, \`.html\`, \`.scss\`), DEBES ejecutar ambos comandos en secuencia:
\`\`\`bash
npx ng build
npx cap sync <plataforma>
\`\`\`

---

## Plataforma A: Aplicación de Escritorio Windows (Electron)

**1. Instalar la plataforma (Sólo la primera vez):**
\`\`\`bash
npm install @capacitor-community/electron --legacy-peer-deps
npx cap add @capacitor-community/electron
\`\`\`

**2. Compilar e integrar:**
\`\`\`bash
npx ng build
npx cap sync @capacitor-community/electron
\`\`\`

**3. Ejecutar y Probar:**
\`\`\`bash
npx cap open @capacitor-community/electron
\`\`\`
*(Para generar el ejecutable instalable \`.exe\`, verifica la documentación de \`electron-builder\` generada dentro de la carpeta \`electron/\`).*

---

## Plataforma B: Dispositivos Móviles Android (APK)

*(Requiere Android Studio y Java SDK instalados).*

**1. Instalar la plataforma (Sólo la primera vez):**
\`\`\`bash
npm install @capacitor/android
npx cap add android
\`\`\`

**2. Compilar e integrar:**
\`\`\`bash
npx ng build
npx cap sync android
\`\`\`

**3. Generar el instalador (APK):**
\`\`\`bash
npx cap open android
\`\`\`
Dentro de Android Studio:
1. Permite que \`Gradle\` sincronice las dependencias (barra inferior).
2. Para exportar la aplicación compártible: Ve al menú \`Build\` > \`Build Bundle(s) / APK(s)\` > \`Build APK(s)\`.
3. El archivo \`.apk\` resultante podrá ser enviado vía Bluetooth o USB e instalado en cualquier tablet o móvil de los maestros.
