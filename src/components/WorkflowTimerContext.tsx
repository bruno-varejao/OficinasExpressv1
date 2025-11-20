import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface WorkflowTimer {
  workOrderId: string
  workOrderNumber: string
  workflowStatus: string
  accumulatedTime: number
  sessionStartTime: number | null
  isPaused: boolean
}

interface WorkflowTimerContextType {
  activeTimers: Map<string, WorkflowTimer>
  startTimer: (workOrderId: string, workOrderNumber: string, workflowStatus: string, accumulatedTime: number) => void
  pauseTimer: (workOrderId: string) => void
  stopTimer: (workOrderId: string) => void
  updateTimerStatus: (workOrderId: string, newStatus: string, newAccumulatedTime: number) => void
  getTimerTime: (workOrderId: string) => number
  isTimerActive: (workOrderId: string) => boolean
  isTimerPaused: (workOrderId: string) => boolean
}

const WorkflowTimerContext = createContext<WorkflowTimerContextType | undefined>(undefined)

export const useWorkflowTimer = () => {
  const context = useContext(WorkflowTimerContext)
  if (!context) {
    throw new Error('useWorkflowTimer must be used within WorkflowTimerProvider')
  }
  return context
}

interface WorkflowTimerProviderProps {
  children: React.ReactNode
  accessToken: string
}

export const WorkflowTimerProvider: React.FC<WorkflowTimerProviderProps> = ({ children, accessToken }) => {
  const [activeTimers, setActiveTimers] = useState<Map<string, WorkflowTimer>>(new Map())
  const [currentTime, setCurrentTime] = useState(Date.now()) // Para forçar re-render
  const saveIntervalRef = useRef<any>(null)

  // Status que fazem contagem de tempo
  const timedStatuses = ['diagnosis', 'execution']

  // Atualizar currentTime a cada segundo para forçar re-render nos componentes que usam getTimerTime
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-save periódico (a cada 30 segundos)
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      saveAllTimers()
    }, 30000) // 30 segundos

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
      // Salvar tudo ao desmontar
      saveAllTimers()
    }
  }, [activeTimers])

  const saveAllTimers = async () => {
    const timers = Array.from(activeTimers.values())
    
    for (const timer of timers) {
      const currentTotal = calculateTotalTime(timer)
      
      console.log('💾 Auto-save timer:', {
        workOrderId: timer.workOrderId,
        workOrderNumber: timer.workOrderNumber,
        status: timer.workflowStatus,
        totalTime: currentTotal
      })

      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${timer.workOrderId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              workflowAccumulatedTime: currentTotal
            })
          }
        )
      } catch (error) {
        console.error('Erro ao salvar timer:', error)
      }
    }
  }

  const calculateTotalTime = (timer: WorkflowTimer): number => {
    if (timer.isPaused || !timer.sessionStartTime) {
      return timer.accumulatedTime
    }
    const sessionDuration = Math.floor((Date.now() - timer.sessionStartTime) / 1000)
    return timer.accumulatedTime + sessionDuration
  }

  const startTimer = (workOrderId: string, workOrderNumber: string, workflowStatus: string, accumulatedTime: number) => {
    if (!timedStatuses.includes(workflowStatus)) {
      console.log('⏸️ Status não requer timer:', workflowStatus)
      return
    }

    console.log('⏱️ Timer Global: Iniciando/retomando timer para WO', workOrderNumber, {
      workOrderId,
      workflowStatus,
      accumulatedTime
    })

    setActiveTimers(prev => {
      const newTimers = new Map(prev)
      const existingTimer = newTimers.get(workOrderId)
      
      if (existingTimer) {
        // Timer já existe
        if (existingTimer.isPaused) {
          // Timer estava pausado, retomar
          console.log('▶️ Retomando timer PAUSADO. Tempo acumulado:', existingTimer.accumulatedTime)
          newTimers.set(workOrderId, {
            ...existingTimer,
            workflowStatus,
            sessionStartTime: Date.now(),
            isPaused: false
          })
        } else {
          // Timer JÁ está ativo - NÃO ALTERAR sessionStartTime!
          console.log('✅ Timer já ATIVO. Mantendo sessão em andamento. Tempo:', existingTimer.accumulatedTime)
          // Apenas atualizar status se mudou
          if (existingTimer.workflowStatus !== workflowStatus) {
            newTimers.set(workOrderId, {
              ...existingTimer,
              workflowStatus
            })
          }
          // Não modificar nada se já está ativo!
        }
      } else {
        // Criar novo timer
        newTimers.set(workOrderId, {
          workOrderId,
          workOrderNumber,
          workflowStatus,
          accumulatedTime,
          sessionStartTime: Date.now(),
          isPaused: false
        })
      }
      return newTimers
    })
  }

  const pauseTimer = (workOrderId: string) => {
    console.log('⏸️ Timer Global: Pausando timer para WO', workOrderId)
    
    setActiveTimers(prev => {
      const newTimers = new Map(prev)
      const timer = newTimers.get(workOrderId)
      
      if (timer && timer.sessionStartTime) {
        // Consolidar tempo da sessão atual antes de pausar
        const sessionDuration = Math.floor((Date.now() - timer.sessionStartTime) / 1000)
        const newAccumulatedTime = timer.accumulatedTime + sessionDuration
        
        console.log('💾 Consolidando tempo antes de pausar:', {
          sessionDuration,
          previousAccumulated: timer.accumulatedTime,
          newAccumulatedTime
        })
        
        newTimers.set(workOrderId, {
          ...timer,
          accumulatedTime: newAccumulatedTime,
          sessionStartTime: null,
          isPaused: true
        })
        
        // Salvar no backend
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${workOrderId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              workflowAccumulatedTime: newAccumulatedTime
            })
          }
        ).catch(error => {
          console.error('Erro ao salvar tempo pausado:', error)
        })
      }
      
      return newTimers
    })
  }

  const stopTimer = (workOrderId: string) => {
    console.log('⏹️ Timer Global: Parando e removendo timer para WO', workOrderId)
    
    const timer = activeTimers.get(workOrderId)
    if (timer) {
      const finalTime = calculateTotalTime(timer)
      
      // Salvar no backend antes de remover
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${workOrderId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflowAccumulatedTime: finalTime
          })
        }
      ).catch(error => {
        console.error('Erro ao salvar tempo final:', error)
      })
    }

    setActiveTimers(prev => {
      const newTimers = new Map(prev)
      newTimers.delete(workOrderId)
      return newTimers
    })
  }

  const updateTimerStatus = (workOrderId: string, newStatus: string, newAccumulatedTime: number) => {
    const timer = activeTimers.get(workOrderId)
    
    if (timedStatuses.includes(newStatus)) {
      // Novo status requer timer (diagnosis ou execution)
      if (timer) {
        // Timer já existe
        if (timer.isPaused) {
          // Timer estava pausado, retomar
          console.log('▶️ Timer Global: Retomando timer pausado', {
            workOrderId,
            newStatus,
            accumulatedTime: timer.accumulatedTime
          })
          setActiveTimers(prev => {
            const newTimers = new Map(prev)
            newTimers.set(workOrderId, {
              ...timer,
              workflowStatus: newStatus,
              sessionStartTime: Date.now(),
              isPaused: false
            })
            return newTimers
          })
        } else {
          // Timer já está ativo, apenas atualizar status
          console.log('🔄 Timer Global: Atualizando timer ativo', {
            workOrderId,
            newStatus,
            currentAccumulated: timer.accumulatedTime
          })
          
          // Consolidar tempo da sessão atual
          const sessionDuration = timer.sessionStartTime 
            ? Math.floor((Date.now() - timer.sessionStartTime) / 1000)
            : 0
          const consolidatedTime = timer.accumulatedTime + sessionDuration
          
          setActiveTimers(prev => {
            const newTimers = new Map(prev)
            newTimers.set(workOrderId, {
              ...timer,
              workflowStatus: newStatus,
              accumulatedTime: consolidatedTime,
              sessionStartTime: Date.now(),
              isPaused: false
            })
            return newTimers
          })
        }
      } else {
        // Criar novo timer
        console.log('✨ Timer Global: Criando novo timer', {
          workOrderId,
          newStatus,
          newAccumulatedTime
        })
        setActiveTimers(prev => {
          const newTimers = new Map(prev)
          newTimers.set(workOrderId, {
            workOrderId,
            workOrderNumber: '',
            workflowStatus: newStatus,
            accumulatedTime: newAccumulatedTime,
            sessionStartTime: Date.now(),
            isPaused: false
          })
          return newTimers
        })
      }
    } else {
      // Novo status NÃO requer timer (pausar em vez de remover)
      if (timer && !timer.isPaused) {
        console.log('⏸️ Timer Global: Pausando timer (status não requer contagem)', {
          workOrderId,
          newStatus
        })
        pauseTimer(workOrderId)
        
        // Atualizar status do timer pausado
        setActiveTimers(prev => {
          const newTimers = new Map(prev)
          const pausedTimer = newTimers.get(workOrderId)
          if (pausedTimer) {
            newTimers.set(workOrderId, {
              ...pausedTimer,
              workflowStatus: newStatus
            })
          }
          return newTimers
        })
      }
    }
  }

  const getTimerTime = (workOrderId: string): number => {
    const timer = activeTimers.get(workOrderId)
    if (!timer) return 0
    return calculateTotalTime(timer)
  }

  const isTimerActive = (workOrderId: string): boolean => {
    const timer = activeTimers.get(workOrderId)
    // Timer está ativo se existe e NÃO está pausado
    return timer ? !timer.isPaused : false
  }

  const isTimerPaused = (workOrderId: string): boolean => {
    const timer = activeTimers.get(workOrderId)
    return timer ? timer.isPaused : false
  }

  return (
    <WorkflowTimerContext.Provider 
      value={{
        activeTimers,
        startTimer,
        pauseTimer,
        stopTimer,
        updateTimerStatus,
        getTimerTime,
        isTimerActive,
        isTimerPaused
      }}
    >
      {children}
    </WorkflowTimerContext.Provider>
  )
}
