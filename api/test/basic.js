module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    message: 'Basic endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method
  });
};