exports.default = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ 
    success: true,
    message: 'Minimal endpoint working',
    timestamp: Date.now()
  });
};