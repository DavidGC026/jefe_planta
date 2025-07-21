import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, BarChart3, Download, Loader2, RefreshCw } from 'lucide-react';
import databaseService from '@/services/database';
import { APPROVAL_MIN, APPROVAL_MAX } from '@/config/evaluation';

const HistoryScreen = ({ onBack }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getResults();
      setHistoryData(data);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Error al cargar el historial de evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const data = await databaseService.exportData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `historial_evaluaciones_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error downloading history:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= APPROVAL_MAX) return 'text-green-600 bg-green-50';
    if (score >= APPROVAL_MIN) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando historial de evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={onBack}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </Button>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
                    Historial de Evaluaciones
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={loadHistory}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar</span>
                  </Button>
                  <Button
                    onClick={handleDownloadJSON}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar JSON</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border border-red-200">
              <CardContent className="p-4">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{historyData.length}</div>
                  <div className="text-sm text-gray-600">Total Evaluaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {historyData.filter(item => item.total_obtenido >= APPROVAL_MIN).length}
                  </div>
                  <div className="text-sm text-gray-600">Aprobadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {historyData.filter(item => item.total_obtenido < APPROVAL_MIN).length}
                  </div>
                  <div className="text-sm text-gray-600">Reprobadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {historyData.length > 0 ? Math.round(historyData.reduce((sum, item) => sum + (item.total_obtenido || 0), 0) / historyData.length) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Promedio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {historyData.length === 0 ? (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay evaluaciones registradas</h3>
                <p className="text-gray-500">Las evaluaciones completadas aparecerán aquí.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {historyData.map((evaluation, index) => (
                <motion.div
                  key={evaluation.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <User className="w-10 h-10 text-blue-600 bg-blue-100 p-2 rounded-full" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {evaluation.nombre || 'Usuario desconocido'}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(evaluation.created_at || evaluation.fecha)}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Tipo: {evaluation.tipo_evaluacion || 'Personal'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getScoreColor(evaluation.total_obtenido || 0)}`}>
                            {evaluation.total_obtenido || 0}%
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {(evaluation.total_obtenido || 0) >= APPROVAL_MIN ? 'Aprobado' : 'Reprobado'}
                          </div>
                        </div>
                      </div>
                      
                      {evaluation.observaciones && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{evaluation.observaciones}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Character */}
      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
      />
    </div>
  );
};

export default HistoryScreen;
