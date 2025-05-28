const guardianController = {
    getAllGuardians: async (req, res) => {
      res.json({
        success: true,
        message: 'Guardian controller - to be implemented',
        message_uz: 'Vasiy kontrolleri - amalga oshirilishi kerak'
      });
    },
  
    getGuardianById: async (req, res) => {
      res.json({
        success: true,
        message: 'Get guardian by ID - to be implemented',
        message_uz: 'Vasiyni ID bo\'yicha olish - amalga oshirilishi kerak'
      });
    },
  
    createGuardian: async (req, res) => {
      res.json({
        success: true,
        message: 'Create guardian - to be implemented',
        message_uz: 'Vasiy yaratish - amalga oshirilishi kerak'
      });
    },
  
    updateGuardian: async (req, res) => {
      res.json({
        success: true,
        message: 'Update guardian - to be implemented',
        message_uz: 'Vasiyni yangilash - amalga oshirilishi kerak'
      });
    },
  
    deleteGuardian: async (req, res) => {
      res.json({
        success: true,
        message: 'Delete guardian - to be implemented',
        message_uz: 'Vasiyni o\'chirish - amalga oshirilishi kerak'
      });
    }
  };
  
  module.exports = {
    classController,
    subjectController,
    guardianController
  };