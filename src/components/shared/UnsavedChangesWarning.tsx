import { AlertCircle, Save, X } from 'lucide-react'
import { Button } from '../ui/button'
import { motion, AnimatePresence } from 'motion/react'

interface UnsavedChangesWarningProps {
  show: boolean
  onSave: () => void
  onDiscard: () => void
}

/**
 * Aviso de alterações não guardadas
 * Mostra uma barra flutuante quando há alterações pendentes
 */
export function UnsavedChangesWarning({ 
  show, 
  onSave, 
  onDiscard 
}: UnsavedChangesWarningProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Tem alterações não guardadas</span>
            <div className="flex items-center gap-2 ml-4">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={onSave}
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                <Save className="h-3 w-3 mr-1" />
                Guardar
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDiscard}
                className="text-white hover:bg-orange-600"
              >
                <X className="h-3 w-3 mr-1" />
                Descartar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
