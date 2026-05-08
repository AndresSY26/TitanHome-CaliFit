# 🔱 TitanHome CaliFit - Smart Calisthenics Home Coach

![TitanHome Banner](https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

**TitanHome CaliFit** es una plataforma de entrenamiento inteligente diseñada para transformar tu hogar en un templo de calistenia. Utilizando una arquitectura moderna basada en **Node.js**, **Express** y **EJS**, combinada con una estética **Glassmorphism** premium, esta aplicación ofrece una experiencia de gamificación estilo RPG única en su clase.

## 🚀 Características Principales

### 💎 Interfaz Ultra-Moderna (Glassmorphism)
*   Diseño técnico y elegante basado en transparencias, desenfoques dinámicos y acentos neón.
*   Experiencia de usuario fluida con micro-animaciones y layouts responsivos.
*   **Navegación SPA con URLs Limpias**: Rutas amigables (`/dashboard`, `/guild`, `/catalog`) sin recarga de página gracias a la *History API*.

### 🎮 Sistema de Progresión RPG (Gamificación)
*   **Rangos de Cazador**: Escala desde el *Rango E (Novato)* hasta el legendario *Rango S (Titán)* acumulando repeticiones totales.
*   **Atributos Dinámicos**: Tu **Fuerza**, **Resistencia**, **Agilidad** y **Vitalidad** suben de nivel dependiendo de la rutina que completes.
*   **Gremio de Cazadores (Leaderboard)**: Sección social donde puedes ver tu posición en el Salón de la Fama frente a otros cazadores.

### 🤖 Coach Inteligente & Análisis Biomecánico
*   **Ajuste Dinámico**: El algoritmo analiza tu rendimiento en tiempo real. Si superas tus metas, la dificultad aumenta; si te cuesta, el Coach ajusta el plan.
*   **Retroalimentación por Voz**: El Coach te habla durante los descansos y al finalizar la sesión utilizando la *Web Speech API*.
*   **Swap de Ejercicios (Re-roll)**: ¿Un ejercicio es muy difícil o no tienes el equipo? Cámbialo por otro equivalente del mismo grupo muscular con un solo clic.

### 🍎 Nutrición Táctica Contextual
*   Generación de consejos nutricionales basados en tu **IMC** y el tipo de entrenamiento realizado, optimizando tu recuperación post-misión.

### 📱 Progressive Web App (PWA) & Notificaciones Push
*   **Instalable**: Añade CaliFit a tu pantalla de inicio como una app nativa.
*   **Modo Offline**: Soporte para funcionamiento sin conexión gracias a Service Workers.
*   **Notificaciones Push Reales**: Recibe alertas del Coach incluso cuando la aplicación está cerrada (Web Push Notifications).

## 🛠️ Stack Tecnológico

*   **Backend**: Node.js, Express.
*   **Frontend**: Vanilla JS (ES Modules), CSS Puro (Variables & Flexbox/Grid), EJS.
*   **Visualización**: Chart.js (Radar Stats).
*   **Notificaciones**: Web-Push (VAPID).
*   **Seguridad**: Helmet (CSP), Rate Limiting, CORS.
*   **Almacenamiento**: Persistencia local inteligente con `localStorage`.

## 📦 Instalación y Uso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/AndresSY26/TitanHome-CaliFit.git
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:**
   Crea un archivo `.env` en la raíz y añade tus claves VAPID (el servidor las generará automáticamente si faltan en desarrollo):
   ```env
   PORT=3000
   NODE_ENV=development
   VAPID_PUBLIC_KEY=tu_clave_publica
   VAPID_PRIVATE_KEY=tu_clave_privada
   ```

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Acceder a la plataforma:**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📜 Licencia

Este proyecto está bajo la licencia MIT.

---
*Desarrollado con pasión para Titanes por AndresSY26.*
