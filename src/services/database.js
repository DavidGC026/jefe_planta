// Simulación de una base de datos local
// En producción, esto se conectaría a MySQL/PostgreSQL/etc.

class DatabaseService {
  constructor() {
    this.dbName = 'resultados';
    this.initDB();
  }

  initDB() {
    // Inicializar localStorage para simular base de datos
    if (!localStorage.getItem(this.dbName)) {
      localStorage.setItem(this.dbName, JSON.stringify([]));
    }
  }

  // Obtener todos los resultados
  getResults() {
    try {
      const data = localStorage.getItem(this.dbName);
      return JSON.parse(data) || [];
    } catch (error) {
      console.error('Error al obtener resultados:', error);
      return [];
    }
  }

  // Guardar nuevo resultado
  saveResult(evaluationData) {
    try {
      const results = this.getResults();
      const newResult = {
        id: Date.now(), // ID simple basado en timestamp
        nombre: evaluationData.nombre || 'usuario1',
        fecha: new Date().toISOString(),
        fecha_formateada: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        tipo_evaluacion: 'personal',
        calificaciones_secciones: evaluationData.calificaciones_secciones || {},
        total_obtenido: evaluationData.total_obtenido || 0,
        respuestas: evaluationData.respuestas || {},
        observaciones: evaluationData.observaciones || '',
        created_at: new Date().toISOString()
      };

      results.push(newResult);
      localStorage.setItem(this.dbName, JSON.stringify(results));
      
      console.log('Resultado guardado:', newResult);
      return newResult;
    } catch (error) {
      console.error('Error al guardar resultado:', error);
      throw new Error('No se pudo guardar el resultado en la base de datos');
    }
  }

  // Obtener resultado por ID
  getResultById(id) {
    try {
      const results = this.getResults();
      return results.find(result => result.id === parseInt(id));
    } catch (error) {
      console.error('Error al obtener resultado:', error);
      return null;
    }
  }

  // Eliminar resultado
  deleteResult(id) {
    try {
      const results = this.getResults();
      const filteredResults = results.filter(result => result.id !== parseInt(id));
      localStorage.setItem(this.dbName, JSON.stringify(filteredResults));
      return true;
    } catch (error) {
      console.error('Error al eliminar resultado:', error);
      return false;
    }
  }

  // Limpiar toda la base de datos (para testing)
  clearDB() {
    localStorage.removeItem(this.dbName);
    this.initDB();
  }

  // Exportar datos como JSON
  exportData() {
    return this.getResults();
  }

  // Importar datos desde JSON
  importData(data) {
    try {
      if (Array.isArray(data)) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
        return true;
      }
      throw new Error('Los datos deben ser un array');
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
  }
}

// Instancia singleton
const databaseService = new DatabaseService();

export default databaseService;
