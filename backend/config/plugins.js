module.exports = ({ env }) => ({
    documentation: {
      enabled: true,
      config: {
        path: '/documentation', // ruta de la documentación
        autoGenerate: true,     // genera automáticamente la documentación
      },
    },
  });
  