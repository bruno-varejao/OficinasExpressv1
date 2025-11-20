interface PortugueseLicensePlateProps {
  licensePlate: string
  size?: 'sm' | 'md' | 'lg'
}

export function PortugueseLicensePlate({ licensePlate, size = 'md' }: PortugueseLicensePlateProps) {
  // Configurações de tamanho
  const sizeConfig = {
    sm: {
      container: 'h-9',
      euBar: 'w-7',
      euBarPadding: 'py-1 px-1',
      text: 'text-base',
      pText: 'text-[11px]',
      starSize: 3.5,
      starRadius: 4.5
    },
    md: {
      container: 'h-14',
      euBar: 'w-12',
      euBarPadding: 'py-1.5 px-1',
      text: 'text-2xl',
      pText: 'text-sm',
      starSize: 5,
      starRadius: 7
    },
    lg: {
      container: 'h-20',
      euBar: 'w-16',
      euBarPadding: 'py-2 px-1',
      text: 'text-4xl',
      pText: 'text-lg',
      starSize: 7,
      starRadius: 10
    }
  }

  const config = sizeConfig[size]

  return (
    <div className={`inline-flex items-stretch bg-white border-[3px] border-black rounded-md overflow-hidden shadow-lg ${config.container}`}>
      {/* Barra Azul da UE - encostada à esquerda */}
      <div className={`bg-[#003399] ${config.euBar} flex flex-col items-center justify-center text-white ${config.euBarPadding}`}>
        {/* Estrelas da UE em círculo */}
        <div className="relative flex-1 flex items-center justify-center w-full mb-0.5">
          <div className="relative" style={{ width: config.starRadius * 2 + 'px', height: config.starRadius * 2 + 'px' }}>
            {/* Círculo de 12 estrelas */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const x = config.starRadius + config.starRadius * Math.cos(angle)
              const y = config.starRadius + config.starRadius * Math.sin(angle)
              return (
                <span
                  key={i}
                  className="absolute font-bold leading-none select-none"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${config.starSize}px`,
                    textShadow: '0 0 1px rgba(255,255,255,0.3)'
                  }}
                >
                  ★
                </span>
              )
            })}
          </div>
        </div>
        {/* Letra P */}
        <div className={`font-bold ${config.pText} leading-none select-none`} style={{ textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>
          P
        </div>
      </div>
      
      {/* Matrícula */}
      <div className={`flex-1 flex items-center justify-center px-3 ${config.text} tracking-[0.2em] font-bold select-none`}>
        {licensePlate?.toUpperCase() || 'AA-00-AA'}
      </div>
    </div>
  )
}
