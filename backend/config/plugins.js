module.exports = ({ env }) => ({
    documentation: {
      enabled: true,
      config: {
        path: '/documentation', // ruta de la documentación
        autoGenerate: true,     // genera automáticamente la documentación
      },
    },
    // Hard-disable internationalization plugin
    i18n: false,
    'schema-visualizer': {
      enabled: true,
    },
    'config-sync': {
      enabled: true,
    }
  });
  