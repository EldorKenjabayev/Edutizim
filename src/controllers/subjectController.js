const subjectController = {
    getAllSubjects: async (req, res) => {
      res.json({
        success: true,
        message: 'Subject controller - to be implemented',
        message_uz: 'Fan kontrolleri - amalga oshirilishi kerak'
      });
    },
  
    getSubjectById: async (req, res) => {
      res.json({
        success: true,
        message: 'Get subject by ID - to be implemented',
        message_uz: 'Fanni ID bo\'yicha olish - amalga oshirilishi kerak'
      });
    },
  
    createSubject: async (req, res) => {
      res.json({
        success: true,
        message: 'Create subject - to be implemented',
        message_uz: 'Fan yaratish - amalga oshirilishi kerak'
      });
    },
  
    updateSubject: async (req, res) => {
      res.json({
        success: true,
        message: 'Update subject - to be implemented',
        message_uz: 'Fanni yangilash - amalga oshirilishi kerak'
      });
    },
  
    deleteSubject: async (req, res) => {
      res.json({
        success: true,
        message: 'Delete subject - to be implemented',
        message_uz: 'Fanni o\'chirish - amalga oshirilishi kerak'
      });
    }
  };