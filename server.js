const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3003;

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database (only in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 Database synchronized.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 EduSmartSystem Backend running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API Documentation: http://localhost:${PORT}/api/docs`);
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();