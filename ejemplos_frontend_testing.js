// EJEMPLOS DE PETICIONES VÁLIDAS PARA TESTING
// Archivo: ejemplos_peticiones_frontend.js

// EJEMPLO 1: Crear paciente adulto (sin tutor)
const ejemploPacienteAdulto = {
  "nombre": "Juan Carlos",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "González",
  "rut": "12345678-9",
  "telefono": "+56912345678",
  "correo": "juan.perez@email.com",
  "direccion": "Av. Libertador 123, Santiago",
  "nacionalidad": "Chilena"
};

// EJEMPLO 2: Crear paciente adulto (datos mínimos)
const ejemploPacienteMinimo = {
  "nombre": "María",
  "apellidoPaterno": "Silva",
  "rut": "98765432-1"
};

// EJEMPLO 3: Crear paciente menor con tutor
const ejemploPacienteConTutor = {
  "nombrePaciente": "Sofía",
  "apellidoPaterno": "Rodríguez",
  "apellidoMaterno": "López",
  "rut": "23456789-K",
  "telefonoPaciente": null,
  "correoPaciente": null,
  "direccionPaciente": "Calle Principal 456",
  "nacionalidad": "Chilena",
  "nombreTutor": "Carmen",
  "apellidoTutor": "López",
  "direccionTutor": "Calle Principal 456",
  "correoTutor": "carmen.lopez@email.com",
  "telefonoTutor": "+56987654321"
};

// FUNCIONES PARA TESTING EN EL FRONTEND (Angular)

// 1. Función para crear paciente adulto
export function crearPacienteAdulto(datospaciente) {
  return this.http.post('http://localhost:3000/api/pacientes', datospaciente, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// 2. Función para crear paciente con tutor
export function crearPacienteConTutor(datosPacienteYTutor) {
  return this.http.post('http://localhost:3000/api/pacientes/con-tutor', datosPacienteYTutor, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// 3. Función de prueba simple
export function probarEndpoint() {
  return this.http.post('http://localhost:3000/api/pacientes/test', {
    mensaje: 'Prueba desde Angular'
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// PROBLEMAS COMUNES Y SOLUCIONES:

/* 
1. ERROR 400 - Bad Request:
   - Verificar que los campos obligatorios están presentes
   - Verificar que el formato del RUT sea correcto (12345678-9)
   - Verificar que los campos no estén vacíos o sean null cuando son requeridos

2. ERROR 409 - Conflict:
   - El RUT ya existe en la base de datos

3. ERROR 500 - Internal Server Error:
   - Las tablas no existen en la base de datos
   - Error de conexión a la base de datos
   - Error en la consulta SQL

DEBUGGING:
1. Primero prueba: GET http://localhost:3000/api/pacientes/verificar-tablas
2. Luego prueba: POST http://localhost:3000/api/pacientes/test
3. Finalmente prueba: POST http://localhost:3000/api/pacientes con datos válidos
*/

// VALIDACIONES DEL FRONTEND (recomendadas)
export function validarDatosPaciente(datos) {
  const errores = [];
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('El nombre es obligatorio');
  }
  
  if (!datos.apellidoPaterno || datos.apellidoPaterno.trim() === '') {
    errores.push('El apellido paterno es obligatorio');
  }
  
  if (!datos.rut || datos.rut.trim() === '') {
    errores.push('El RUT es obligatorio');
  }
  
  // Validación básica de formato RUT
  const rutRegex = /^\d{7,8}-[\dkK]$/;
  if (datos.rut && !rutRegex.test(datos.rut.trim())) {
    errores.push('El formato del RUT debe ser: 12345678-9 o 1234567-K');
  }
  
  return errores;
}
