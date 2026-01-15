const { mergeConfig } = require('vite');

module.exports = (config) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      // Permite todos los hosts en producción (App Runner)
      // En desarrollo, Vite permite localhost por defecto
      allowedHosts: process.env.NODE_ENV === 'production' 
        ? 'all' 
        : ['localhost', '127.0.0.1', 'gep8aekqnp.us-east-1.awsapprunner.com'],
    },
  });
};
