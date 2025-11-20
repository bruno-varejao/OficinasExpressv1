import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Star } from 'lucide-react'

interface WorkshopReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workshopName: string
  workshopId: string
  appointmentId: string
  onSubmit: (rating: number, comment: string) => void
  loading: boolean
}

export function WorkshopReviewDialog({
  open,
  onOpenChange,
  workshopName,
  workshopId,
  appointmentId,
  onSubmit,
  loading
}: WorkshopReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (rating === 0) {
      return
    }
    onSubmit(rating, comment)
  }

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setComment('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Avaliar Oficina</DialogTitle>
          <DialogDescription>
            Como foi a sua experiência com <strong>{workshopName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Classificação *
            </label>
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-12 w-12 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {rating === 0 && 'Selecione uma classificação'}
                {rating === 1 && '⭐ Muito Mau'}
                {rating === 2 && '⭐⭐ Mau'}
                {rating === 3 && '⭐⭐⭐ Razoável'}
                {rating === 4 && '⭐⭐⭐⭐ Bom'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excelente'}
              </p>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Comentário (Opcional)
            </label>
            <Textarea
              placeholder="Partilhe a sua experiência com outros clientes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="text-blue-900">
              ℹ️ A sua avaliação será pública e ajudará outros clientes a escolher esta oficina.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="bg-gradient-to-r from-blue-600 to-orange-500"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                A enviar...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
