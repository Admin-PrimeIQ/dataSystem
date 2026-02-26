module.exports = ({ env }) => ({
    documentation: {
      enabled: true,
      config: {
        openapi: '3.0.0',
        info: {
          title: 'API Documentation',
          version: '1.0.1',
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
    },
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST', 'smtp.gmail.com'),
          port: env.int('SMTP_PORT', 587),
          secure: env.bool('SMTP_SECURE', false), // true for 465, false for other ports
          requireTLS: env.bool('SMTP_REQUIRE_TLS', true), // Require TLS for Gmail
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD'),
          },
          tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: env.bool('SMTP_TLS_REJECT_UNAUTHORIZED', false),
          },
        },
        settings: {
          defaultFrom: env('SMTP_DEFAULT_FROM', 'no-reply@devroot.studio'),
          defaultReplyTo: env('SMTP_DEFAULT_REPLY_TO', 'no-reply@devroot.studio'),
        },
      },
    },
  });
  