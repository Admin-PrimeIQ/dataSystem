module.exports = ({ env }) => ({
    documentation: {
      enabled: true,
      config: {
        openapi: '3.0.0',
        info: {
          title: 'API Documentation',
          version: '1.0.0',
        },
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
  