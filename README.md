# 🔱 TitanHome CaliFit - Tu Gimnasio en Casa con Inteligencia

![Banner](https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

**TitanHome CaliFit** es un entrenador personal inteligente de calistenia diseñado para transformar tu cuerpo usando únicamente tu peso corporal. Esta aplicación migra una lógica SPA avanzada a una arquitectura robusta de **Node.js + Express**, ofreciendo una experiencia premium, segura y altamente personalizada.

## 🚀 Características Principales

### 🧠 Coach Inteligente & Algoritmo de Rutinas
- **Análisis de Perfil**: Cálculo automático de IMC con diagnóstico de composición corporal.
- **Generación de Rutinas**: Algoritmo que asigna ejercicios basados en tu nivel (Principiante, Intermedio, Experto) y categorías musculares (Empuje, Tirón, Base).
- **Selección Estricta**: Los ejercicios se filtran para evitar equipamiento (Anti-Equipo) y duplicidad entre días de entrenamiento.

### 📅 Dashboard del Titán
- **Calendario Semanal**: Visualización clara de días de entrenamiento y descanso.
- **Rastreador de Horario**: Widget dinámico que sincroniza con tu horario local para indicarte cuándo es hora de entrenar.
- **Historial de Progreso**: Persistencia local de días completados.

### 🎬 Reproductor de Entrenamiento (Live Mode)
- **Animaciones Fluidas**: Guía visual interactiva para cada ejercicio.
- **Smart Coach Prompt**: El sistema detecta automáticamente cuándo deberías haber terminado tus repeticiones según tu perfil biomecánico.
- **Descanso Activo**: Cronómetro integrado para asegurar una recuperación óptima.

### 🔍 Catálogo Maestro
- Base de datos de más de 100 ejercicios filtrados.
- Búsqueda en tiempo real y filtrado por grupos musculares.
- Traducción automática de instrucciones al español.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.
- **Frontend**: Vanilla JavaScript (ES6+), CSS Puro (Diseño Modular, Flexbox, Grid).
- **Vistas**: EJS (Embedded JavaScript templates).
- **Seguridad**: Helmet (CSP), CORS, Rate Limiting.
- **API**: Integración con `free-exercise-db` y proxy de traducción de Google.

## 📦 Instalación y Uso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/AndresSY26/TitanHome-CaliFit.git
   cd TitanHome-CaliFit
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:**
   Crea un archivo `.env` en la raíz (opcional para el puerto):
   ```env
   PORT=3000
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador:**
   `http://localhost:3000`

## 🛡️ Arquitectura MVC
El proyecto sigue el patrón **Modelo-Vista-Controlador** para máxima escalabilidad:
- `/src/controllers`: Lógica de negocio y manejo de datos de ejercicios.
- `/src/routes`: Definición de endpoints de la API y rutas web.
- `/src/views`: Plantillas dinámicas EJS y parciales.
- `/src/public`: Activos estáticos (CSS modular y JS de la SPA).

---
Desarrollado con pasión para Titanes del Fitness. 💪
