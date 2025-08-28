// Endpoint API semplice per testare il runtime Vercel
module.exports = (req, res) => {
  // Imposta immediatamente il Content-Type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('Simple endpoint called:', req.method);
    
    // Risposta semplice
    return res.status(200).json({
      success: true,
      message: 'Endpoint semplice funzionante',
      timestamp: new Date().toISOString(),
      method: req.method,
      runtime: 'vercel-node'
    });
  } catch (error) {
    console.error('Error in simple endpoint:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};