// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController'); // Adjust path if controllers are deeper
const auth = require('../middleware/authMiddleware.js'); // Your JWT authentication middleware (adjust path if needed)

router.post('/start', auth, chatController.startChatSession);
router.post('/message', auth, chatController.sendMessage);

module.exports = router;