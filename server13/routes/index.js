const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send(
    `LoadRunnr API Running on port ${process.env.PORT} in ${process.env.NODE_ENV} mode...........`
  );
});

module.exports = router;
