// Central Spanish dictionary (spec section 7).
// Structure: area → entity → key. Keys in camelCase, values in Spanish.
// Exception: "errors" keys stay UPPER_CASE because they must match lib/errors/codes.ts exactly.
export const es = {
  // Texts shared by 2+ screens with the same meaning
  common: {
    // Form fields (login + register)
    emailLabel: "Correo electrónico",
    emailPlaceholder: "micorreo@gmail.com",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "••••••••",
  },

  home: {
    badge: "Jarvis v1.0 • Sistema activo",
    headingStart: "Bienvenido a",
    headingAccent: "Jarvis",
    subtitle:
      "Tu centro de mando para organizar, priorizar y completar tus tareas.",
    loginButton: "Iniciar sesión",
    registerButton: "Crear cuenta",
  },

  auth: {
    login: {
      // Labels
      badge: "Acceso seguro • Jarvis",
      headingStart: "Iniciar",
      headingAccent: "sesión",
      subtitle: "Ingresa tus credenciales para acceder a tu panel",
      submit: "Ingresar",
      submitting: "Ingresando...",
      noAccountQuestion: "¿No tienes cuenta?",
      registerLink: "Regístrate",
    },

    register: {
      // Labels
      badge: "Nueva cuenta • Jarvis",
      headingStart: "Crear",
      headingAccent: "cuenta",
      subtitle: "Completa tus datos para acceder a tu centro de mando",
      nameLabel: "Nombre completo",
      namePlaceholder: "Escribe tu nombre",
      submit: "Crear cuenta",
      submitting: "Registrando...",
      hasAccountQuestion: "¿Ya tienes cuenta?",
      loginLink: "Inicia sesión",

      // Success messages
      success: "¡Cuenta creada exitosamente!",
    },

    logout: {
      // Labels
      button: "Cerrar sesión",
      buttonLoading: "Cerrando sesión...",

      // Success messages
      success: "Sesión cerrada correctamente",
    },
  },

  dashboard: {
    user: {
      // Labels
      nameLoading: "Cargando",
      nameFallback: "Usuario",
    },

    // JV-1: weekly board (areas × days)
    board: {
      brand: "Jarvis",
      title: "Tablero de la semana",
      loading: "Cargando tablero...",
      loadError: "No pudimos cargar tu tablero.",
      retry: "Reintentar",
      noAreas: "Crea tu primera área con «+ Área» para empezar.",
      noDate: "Sin fecha",
      todaySuffix: "hoy",
      laneEmpty: "Sin tareas esta semana",
      addTaskIn: "Añadir tarea en {area}",
      cellLabel: "{area}, {day}",
      progressLabel: "{done} de {total} hechas esta semana",
      completedLabel: "Hecha",
    },

    week: {
      previous: "Semana anterior",
      next: "Semana siguiente",
      backToToday: "Hoy",
      srPrefix: "Semana del",
    },

    areas: {
      selectorLabel: "Filtrar por área",
      all: "Todas",
      add: "+ Área",
      nameLabel: "Nombre del área nueva",
      namePlaceholder: "Ej.: Inglés",
      created: "Área «{name}» creada",
    },

    newTask: {
      button: "Nueva tarea",
      shortcut: "N",
      titleLabel: "Título de la tarea nueva",
      placeholder: "Nueva tarea en {area}",
      submit: "Crear",
      submitting: "Creando...",
      cancel: "Cancelar",
      needsArea: "Primero crea un área",
      created: "Tarea creada en {area} · Sin fecha",
    },
  },

  errors: {
    // API codes
    INVALID_JSON: "No se pudo procesar la solicitud",
    VALIDATION_ERROR: "Revisa los datos ingresados",
    INVALID_CREDENTIALS: "Correo o contraseña incorrectos",
    USER_ALREADY_EXISTS: "Ya existe una cuenta con este correo",
    UNAUTHORIZED: "Tu sesión expiró. Inicia sesión de nuevo",
    INVALID_TASK_ID: "No pudimos identificar esa tarea",
    TASK_NOT_FOUND: "No encontramos esa tarea. Puede que ya se haya eliminado",
    AREA_ALREADY_EXISTS: "Ya tienes un área con ese nombre",
    AREA_NOT_FOUND: "No encontramos esa área. Puede que ya se haya eliminado",
    INVALID_AREA_ORDER: "No pudimos guardar el nuevo orden. Recarga e inténtalo de nuevo",
    USER_NOT_FOUND: "No encontramos tu cuenta",
    INTERNAL_ERROR: "Algo falló en el servidor. Intenta de nuevo en unos segundos",

    // UI codes
    NETWORK_ERROR: "Error de conexión",
    UNEXPECTED_RESPONSE: "Respuesta inesperada",

    // Fallback for unknown codes
    ERROR_UNEXPECTED: "Error inesperado",
  },

  fieldErrors: {
    REQUIRED: "Completa este campo",
    TOO_SHORT: "Mínimo {min} caracteres",
    TOO_LONG: "Máximo {max} caracteres",
    INVALID_FORMAT: "Revisa que esté bien escrito",
  },
};
