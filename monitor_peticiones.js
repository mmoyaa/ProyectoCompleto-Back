// Archivo: monitor_peticiones.js
const express = require('express');

// Middleware para log de todas las peticiones
const logRequests = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.originalUrl}`);
  
  if (req.method === 'POST' && req.originalUrl.includes('/evaluaciones')) {
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 Respuesta ${res.statusCode}:`, typeof data === 'string' ? data.substring(0, 200) : data);
    originalSend.call(this, data);
  };
  
  next();
};

console.log('🔍 Monitor de peticiones iniciado...');
console.log('Ejecuta tu aplicación Angular y haz clic en "Guardar Evaluación"...');
console.log('Presiona Ctrl+C para detener el monitor\n');

// No podemos modificar directamente el app existente, así que creamos un proxy
const app = express();
app.use(express.json());
app.use(logRequests);

// Proxy a todas las rutas del servidor original
app.use('*', (req, res) => {
  console.log(`🔄 Redirigiendo a servidor principal: ${req.method} ${req.originalUrl}`);
  res.json({ message: 'Monitor activo - ver logs en consola' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔍 Monitor ejecutándose en puerto ${PORT}`);
  console.log(`📊 Para usar el monitor, inicia también el servidor principal en puerto 3000`);
});
