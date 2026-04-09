const express = require('express');
const instructorController = require('../controllers/instructor.controller');

const router = express.Router();

router.get('/:id', instructorController.getProfile);

module.exports = router;
