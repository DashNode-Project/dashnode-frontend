// project_data.js
// Informacion del proyecto Pico Botella

const PROJECT_DATA = {
  name: "Pico Botella",
  fullName: "Pico Botella - Planeación general del proyecto",
  tagline: "Una plantilla ligera para organizar Sprint 1 de un proyecto móvil.",
  version: "2.0.0",
  status: "Sprint 1 - MVP movil",
  team: "Dispositivos Moviles",
  description:
    "Aplicacion movil enfocada en una experiencia simple de giro de botella, retos locales y navegacion rapida entre pantallas basicas.",
  context:
    "El proyecto se desarrolla para el curso Dispositivos Moviles como una propuesta de juego interactivo con almacenamiento local de retos y flujo visual sencillo.",
  objectives: {
    general:
      "Construir una aplicacion movil funcional para Pico Botella con interfaz clara, giro aleatorio de botella y administracion local de retos.",
    specific: [
      "Mostrar una pantalla splash y una pantalla home consistentes con el estilo del proyecto.",
      "Permitir crear, editar y eliminar retos de forma local.",
      "Implementar el giro aleatorio de la botella y la seleccion de un reto.",
      "Agregar controles de audio, compartir y ayuda dentro de la interfaz.",
    ],
  },
  scope: {
    inScope: [
      "Pantalla splash y home principal.",
      "Giro de botella y reto aleatorio.",
      "CRUD local de retos.",
      "Botones de audio, ayuda y compartir.",
    ],
    outScope: [
      "Autenticacion de usuarios.",
      "Sincronizacion en la nube.",
      "Pagos o integraciones externas.",
    ],
  },
  // Secciones vaciadas por petición: conservar títulos en blanco
  legalFramework: [],
  roles: [],
  states: [],
  architecture: {
    description: "",
    principles: [],
    client: { label: "", connectionLabel: "", boxes: [] },
    gateway: { label: "", connectionLabel: "", boxes: [] },
    services: [],
    dataLayer: { label: "", boxes: [] },
    infrastructure: [],
  },
  security: [],
  links: {
    jira: {
      label: "Jira",
      url: "https://correounivalle-team-a619mkqy.atlassian.net/jira/software/projects/PC/boards/71?atlOrigin=eyJpIjoiZGU0ZDFmZGVkMDYxNDY1MWJhOWRiNWZmMTUxYjg2MDAiLCJwIjoiaiJ9",
      icon: "J",
      description: "Tablero de planeación y seguimiento del sprint.",
    },
   
    repoPlanning: {
      label: "Repositorio de planeación",
      url: "https://github.com/pico-botella-project/pico-botella-complete-plan.git",
      icon: "P",
      description: "Repositorio con toda la documentación y archivos de planeación.",
    },
    repoWork: {
      label: "Repositorio de trabajo",
      url: "https://github.com/pico-botella-project/pico-botella-mobile-app.git",
      icon: "M",
      description: "",
    },
  },
};

if (typeof module !== "undefined") {
  module.exports = { PROJECT_DATA };
}


// design_patterns_data.js
// Patrones de diseno para Pico Botella

const DESIGN_PATTERNS_DATA = {
  meta: {
    title: "Patrones de Diseno",
    subtitle: "Soluciones simples para la app Pico Botella",
    description:
      "El proyecto usa patrones ligeros para mantener una base clara, modular y facil de evaluar en el curso Dispositivos Moviles.",
  },
  categories: [
    {
      id: "ui",
      name: "Interfaz y Componentes",
      color: "indigo",
      description: "Organizacion visual y reutilizacion de pantallas y controles.",
      patterns: [
        {
          id: "componentes",
          name: "Componentes reutilizables",
          type: "UI",
          intent: "Separar Splash, Home, Toolbar y Dialogos en partes pequenas y reutilizables.",
          problem: "Una sola vista grande dificulta cambios y pruebas.",
          solution: "Dividir la interfaz en componentes pequenos con responsabilidades claras.",
          benefits: ["Mantenimiento sencillo", "Reuso de UI", "Lectura mas clara"],
          relatedFiles: ["project_data.js"],
        },
      ],
    },
    {
      id: "data",
      name: "Persistencia Local",
      color: "emerald",
      description: "Almacenamiento y recuperacion de retos sin depender de internet.",
      patterns: [
        {
          id: "repository",
          name: "Repository local",
          type: "Data",
          intent: "Encapsular el acceso a storage local o base ligera.",
          problem: "La UI no debe conocer detalles de almacenamiento.",
          solution: "Usar una capa intermedia para leer y escribir retos.",
          benefits: ["Menos acoplamiento", "Pruebas mas faciles", "Cambio de storage simple"],
          relatedFiles: ["backlog_planning.js"],
        },
      ],
    },
  ],
};

if (typeof module !== "undefined") {
  module.exports = { DESIGN_PATTERNS_DATA };
}

// lineamientos_data.js
// Lineamientos del Sprint 1 para Pico Botella

const LINEAMIENTOS_DATA = {
  meta: {
    title: "Lineamientos del Sprint 1",
    subtitle: "Calidad, programación y entrega para Pico Botella",
    version: "2.0.0",
  },
  overview:
    "Esta página resume los lineamientos mínimos del Miniproyecto 1 para mantener la implementación alineada con el enunciado, la evaluación y las condiciones de entrega.",
  sections: [
    {
      id: "quality",
      title: "Criterios de calidad",
      items: [
        "RA-1: cumplir el comportamiento descrito en las historias de usuario y usar arquitectura MVVM con Repository cuando aplique.",
        "RA-1: usar Room/SQLite o almacenamiento local equivalente para persistencia de retos.",
        "RA-1: emplear Fragments y Navigation en los flujos que lo requieran.",
        "RA-2: mantener una interfaz consistente con las historias de usuario, clara y usable en móvil.",
        "RA-3: gestionar historias y tareas en Jira y evidenciar colaboración activa en GitHub.",
      ],
    },
    {
      id: "programming",
      title: "Lineamientos de programación",
      items: [
        "Dividir pantallas y componentes para mantener modularidad y legibilidad.",
        "Concentrar la lógica de datos en una capa de acceso o repositorio.",
        "Mantener nombres coherentes con el proyecto Pico Botella y el curso Dispositivos Moviles.",
        "Evitar complejidad innecesaria: implementar solo lo que exige el Sprint 1.",
        "Documentar decisiones y archivos nuevos cuando aporten trazabilidad al planeador.",
      ],
    },
    {
      id: "delivery",
      title: "Fechas y entrega",
      items: [
        "Inicio del Sprint 1: 2 de junio de 2026, 6:00 pm.",
        "Monitoría: 9 de junio de 2026, 6:00 pm.",
        "Cierre del Sprint 1: 16 de junio de 2026, 6:00 pm.",
        "La sustentación es en equipo y debe incluir repositorio, Jira y app abierta en emulador o dispositivo.",
        "El PDF de entrega debe contener integrantes, enlace al repositorio y enlace a Jira.",
      ],
    },
    {
      id: "commitments",
      title: "Compromisos del equipo",
      items: [
        "Revisar cada historia antes de marcarla como terminada.",
        "Mantener distribución de tareas balanceada y visible en la documentación.",
        "Evitar commits fuera de la fecha de entrega.",
        "Asegurar cámara encendida durante la sustentación, según el enunciado.",
      ],
    },
  ],
};

if (typeof module !== "undefined") {
  module.exports = { LINEAMIENTOS_DATA };
}


// iso_25010_data.js
// Resumen ISO 25010 para Pico Botella

const ISO_25010_DATA = {
  meta: {
    title: "Marco de Calidad ISO 25010",
    subtitle: "Resumen aplicado al proyecto Pico Botella",
    description:
      "Version breve del modelo de calidad para una app movil centrada en usabilidad, eficiencia y mantenibilidad.",
    standard: "ISO/IEC 25010:2011",
    scope: "Calidad del producto de software",
  },
  categories: [
    {
      id: "usabilidad",
      name: "Usabilidad",
      priority: "Alta",
      priorityLevel: "high",
      summary: "Interfaz clara, rapida y facil de usar en pantallas moviles.",
      subcategories: [
        {
          id: "aprendizaje",
          name: "Aprendibilidad",
          definition: "Facilidad con la que una persona entiende y usa la app por primera vez.",
          application: "Splash, home y dialogos deben ser intuitivos para jugar sin instrucciones largas.",
        },
        {
          id: "operabilidad",
          name: "Operabilidad",
          definition: "Facilidad de control y manejo de la interfaz durante el uso.",
          application: "Los botones deben ser accesibles y responder rapido al tacto.",
        },
      ],
    },
    {
      id: "eficiencia",
      name: "Eficiencia de desempeno",
      priority: "Media",
      priorityLevel: "medium",
      summary: "Animaciones fluidas y consumo moderado de recursos en Android.",
      subcategories: [
        {
          id: "tiempo-respuesta",
          name: "Comportamiento temporal",
          definition: "Tiempo de respuesta y fluidez de animaciones.",
          application: "El giro de la botella debe sentirse natural y sin congelar la interfaz.",
        },
      ],
    },
    {
      id: "mantenibilidad",
      name: "Mantenibilidad",
      priority: "Media",
      priorityLevel: "medium",
      summary: "Codigo modular y facil de ajustar para nuevas pantallas o retos.",
      subcategories: [
        {
          id: "modularidad",
          name: "Modularidad",
          definition: "Capacidad de dividir el sistema en partes pequenas y coherentes.",
          application: "Cada pantalla y flujo debe poder cambiarse sin afectar el resto de la app.",
        },
      ],
    },
  ],
};

if (typeof module !== "undefined") {
  module.exports = { ISO_25010_DATA };
}