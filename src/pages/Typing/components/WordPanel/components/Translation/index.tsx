import Tooltip from '@/components/Tooltip'
import { SoundIcon } from '@/components/WordPronunciationIcon/SoundIcon'
import useSpeech from '@/hooks/useSpeech'
import { fontSizeConfigAtom, isTextSelectableAtom, pronunciationConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

export type TranslationProps = {
  trans: string
  showTrans?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  /** 看释义默写模式：放大中文释义 */
  enlarge?: boolean
  /** 点击释义区块：切换显示/隐藏 */
  onClick?: () => void
}

export default function Translation({ trans, showTrans = true, onMouseEnter, onMouseLeave, enlarge = false, onClick }: TranslationProps) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)
  const isShowTransRead = window.speechSynthesis && pronunciationConfig.isTransRead
  const speechOptions = useMemo(() => ({ volume: pronunciationConfig.transVolume }), [pronunciationConfig.transVolume])
  const { speak, speaking } = useSpeech(trans, speechOptions)

  const handleClickSoundIcon = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      speak(true)
    },
    [speak],
  )

  const isTextSelectable = useAtomValue(isTextSelectableAtom)
  return (
    <div
      className={`flex items-center justify-center pb-4 pt-5 ${onClick ? 'cursor-pointer' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        onClick?.()
        e.currentTarget.blur()
      }}
      title={onClick ? '点击隐藏释义' : undefined}
    >
      <span
        className={`max-w-4xl text-center font-sans transition-colors duration-300 dark:text-white dark:text-opacity-80 ${
          isShowTransRead && 'pl-8'
        } ${isTextSelectable && 'select-text'}`}
        style={{ fontSize: (fontSizeConfig.translateFont + (enlarge ? 28 : 0)).toString() + 'px' }}
      >
        {showTrans ? trans : '\u00A0'}
      </span>
      {isShowTransRead && showTrans && (
        <Tooltip content="朗读释义" className="ml-3 h-5 w-5 cursor-pointer leading-7">
          <SoundIcon animated={speaking} onClick={handleClickSoundIcon} className="h-5 w-5" />
        </Tooltip>
      )}
    </div>
  )
}
