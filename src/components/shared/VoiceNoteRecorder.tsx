import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Mic, Square, Play, Pause, Trash2, Save, Check } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface VoiceNoteRecorderProps {
  onSave: (audioBlob: Blob, transcript: string, duration: number) => void
  onCancel?: () => void
  autoTranscribe?: boolean
  maxDuration?: number // segundos
  className?: string
}

/**
 * Componente para gravar notas de voz
 * Ideal para técnicos documentarem observações rapidamente
 */
export function VoiceNoteRecorder({
  onSave,
  onCancel,
  autoTranscribe = true,
  maxDuration = 300, // 5 minutos
  className = ''
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Inicializar reconhecimento de voz (Web Speech API)
    if ('webkitSpeechRecognition' in window && autoTranscribe) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'pt-PT'

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' '
          } else {
            interimTranscript += transcriptPiece
          }
        }

        setTranscript(prev => prev + finalTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoTranscribe])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
            toast.warning('Tempo máximo de gravação atingido')
          }
          return newDuration
        })
      }, 1000)

      // Iniciar reconhecimento de voz
      if (recognitionRef.current && autoTranscribe) {
        recognitionRef.current.start()
        setIsTranscribing(true)
      }

      toast.success('Gravação iniciada', {
        description: 'Fale claramente próximo ao microfone'
      })
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Erro ao aceder ao microfone', {
        description: 'Verifique as permissões do browser'
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      toast.info('Gravação pausada')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      if (recognitionRef.current && autoTranscribe) {
        recognitionRef.current.start()
      }
      
      // Retomar timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
      
      toast.info('Gravação retomada')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        setIsTranscribing(false)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      toast.success('Gravação concluída')
    }
  }

  const playAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    setAudioUrl('')
    setTranscript('')
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
    toast.info('Gravação apagada')
  }

  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob, transcript, duration)
      toast.success('Nota de voz guardada!', {
        description: transcript ? 'Com transcrição automática' : 'Áudio gravado'
      })
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={`border-2 border-orange-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status e Tempo */}
          <div className="text-center">
            {isRecording ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-lg font-semibold text-gray-900">
                    {isPaused ? 'PAUSADO' : 'A GRAVAR'}
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold text-orange-600">
                  {formatTime(duration)}
                </div>
                <div className="text-xs text-gray-500">
                  Máximo: {formatTime(maxDuration)}
                </div>
              </div>
            ) : audioBlob ? (
              <div className="space-y-2">
                <Check className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-900">Gravação Completa</p>
                <p className="text-xs text-gray-500">Duração: {formatTime(duration)}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Mic className="h-12 w-12 text-orange-600 mx-auto" />
                <p className="text-sm text-gray-600">Pronto para gravar</p>
              </div>
            )}
          </div>

          {/* Controles de Gravação */}
          {!audioBlob && (
            <div className="flex justify-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white"
                  size="lg"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Iniciar Gravação
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      className="border-yellow-200 hover:bg-yellow-50"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeRecording}
                      variant="outline"
                      className="border-green-200 hover:bg-green-50"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                  )}
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    className="border-red-200 hover:bg-red-50"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Parar
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Player de Áudio */}
          {audioBlob && (
            <div className="space-y-3">
              <audio
                ref={audioElementRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  variant="outline"
                  size="sm"
                  className="border-blue-200"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <span className="text-xs text-gray-600 font-mono">
                  {formatTime(Math.floor(currentTime))} / {formatTime(duration)}
                </span>
              </div>
            </div>
          )}

          {/* Transcrição */}
          {(isTranscribing || transcript) && (
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${isTranscribing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <p className="text-xs font-semibold text-gray-700">
                  {isTranscribing ? 'A transcrever...' : 'Transcrição'}
                </p>
              </div>
              <p className="text-sm text-gray-800">
                {transcript || 'Aguardando fala...'}
              </p>
            </div>
          )}

          {/* Ações */}
          {audioBlob && (
            <div className="flex gap-2">
              <Button
                onClick={deleteRecording}
                variant="outline"
                className="flex-1 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Apagar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-500 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}

          {onCancel && (
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancelar
            </Button>
          )}

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>💡 Dica:</strong> Fale claramente e próximo ao microfone. 
              {autoTranscribe && ' A transcrição é automática em tempo real.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
