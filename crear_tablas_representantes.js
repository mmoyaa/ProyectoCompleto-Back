const { sql, poolPromise } = require('./db');

async function crearTablasRepresentantes() {
  try {
    const pool = await poolPromise;
    
    console.log('🔨 Creando tablas de representantes...\n');
    
    // Crear tabla representantes
    console.log('📋 Creando tabla representantes...');
    await pool.request().query(`
      CREATE TABLE representantes (
          idRepresentante INT IDENTITY(1,1) PRIMARY KEY,
          nombre NVARCHAR(100) NOT NULL,
          apellido NVARCHAR(100) NOT NULL,
          rut NVARCHAR(12) NOT NULL UNIQUE,
          telefono NVARCHAR(20),
          correo NVARCHAR(150),
          direccion NVARCHAR(255),
          nacionalidad NVARCHAR(50) DEFAULT 'Chilena',
          fechaCreacion DATETIME DEFAULT GETDATE(),
          fechaModificacion DATETIME DEFAULT GETDATE()
      );
    `);
    console.log('✅ Tabla representantes creada');
    
    // Agregar campo idRepresentante a la tabla paciente
    console.log('📋 Agregando campo idRepresentante a tabla paciente...');
    await pool.request().query(`
      ALTER TABLE paciente 
      ADD idRepresentante INT NULL;
    `);
    console.log('✅ Campo idRepresentante agregado a tabla paciente');
    
    // Crear tabla paciente_representante
    console.log('📋 Creando tabla paciente_representante...');
    await pool.request().query(`
      CREATE TABLE paciente_representante (
          idRelacion INT IDENTITY(1,1) PRIMARY KEY,
          idPaciente INT NOT NULL,
          idRepresentante INT NOT NULL,
          relacion NVARCHAR(50) NOT NULL,
          fechaAsignacion DATETIME DEFAULT GETDATE(),
          fechaExpiracion DATETIME NULL,
          activo BIT DEFAULT 1,
          FOREIGN KEY (idPaciente) REFERENCES paciente(idPaciente),
          FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante)
      );
    `);
    console.log('✅ Tabla paciente_representante creada');
    
    // Agregar constraint de clave foránea a paciente
    console.log('📋 Agregando constraint de clave foránea...');
    await pool.request().query(`
      ALTER TABLE paciente
      ADD CONSTRAINT FK_paciente_representante 
      FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante);
    `);
    console.log('✅ Constraint de clave foránea agregado');
    
    // Crear índices
    console.log('📋 Creando índices...');
    await pool.request().query(`
      CREATE INDEX IX_representantes_rut ON representantes(rut);
    `);
    await pool.request().query(`
      CREATE INDEX IX_paciente_representante_paciente ON paciente_representante(idPaciente);
    `);
    await pool.request().query(`
      CREATE INDEX IX_paciente_representante_representante ON paciente_representante(idRepresentante);
    `);
    await pool.request().query(`
      CREATE INDEX IX_paciente_idRepresentante ON paciente(idRepresentante);
    `);
    console.log('✅ Índices creados');
    
    // Crear trigger para fechaModificacion
    console.log('📋 Creando trigger para fechaModificacion...');
    await pool.request().query(`
      CREATE TRIGGER TR_representantes_update
      ON representantes
      AFTER UPDATE
      AS
      BEGIN
          UPDATE representantes 
          SET fechaModificacion = GETDATE()
          FROM representantes r
          INNER JOIN inserted i ON r.idRepresentante = i.idRepresentante;
      END;
    `);
    console.log('✅ Trigger creado');
    
    console.log('\n🎉 ¡Todas las tablas y estructuras de representantes han sido creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Algunas estructuras ya existían, continuando...');
    }
  } finally {
    process.exit(0);
  }
}

crearTablasRepresentantes();
