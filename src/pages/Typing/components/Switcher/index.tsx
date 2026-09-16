import AnalysisButton from '../AnalysisButton'
import ErrorBookButton from '../ErrorBookButton'
import HandPositionIllustration from '../HandPositionIllustration'
import LoopWordSwitcher from '../LoopWordSwitcher'
import Setting from '../Setting'
import SoundSwitcher from '../SoundSwitcher'
import Tooltip from '@/components/Tooltip'
import { isOpenDarkModeAtom, wordDictationConfigAtom, wordDisplayConfigAtom } from '@/store'
import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import IconMoon from '~icons/heroicons/moon-solid'
import IconSun from '~icons/heroicons/sun-solid'
import IconLanguage from '~icons/tabler/language'
import IconLanguageOff from '~icons/tabler/language-off'

export default function Switcher() {
  const [isOpenDarkMode, setIsOpenDarkMode] = useAtom(isOpenDarkModeAtom)
  const [wordDisplayConfig, setWordDisplayConfig] = useAtom(wordDisplayConfigAtom)
  const [wordDictationConfig, setWordDictationConfig] = useAtom(wordDictationConfigAtom)

  const changeDarkModeState = () => {
    setIsOpenDarkMode((old) => !old)
  }

  // 看释义默写模式：放大中文释义，隐藏假名与单词，凭中文回想输入罗马音
  const isDictationTranslateMode = wordDisplayConfig.enlargeTranslation && wordDictationConfig.isOpen

  const toggleDictationTranslateMode = useCallback(() => {
    if (isDictationTranslateMode) {
      setWordDisplayConfig((old) => ({ ...old, enlargeTranslation: false }))
      setWordDictationConfig((old) => ({ ...old, isOpen: false }))
    } else {
      setWordDisplayConfig((old) => ({ ...old, showNotation: false, showTranslation: true, enlargeTranslation: true }))
      setWordDictationConfig((old) => ({ ...old, isOpen: true, type: 'hideAll' }))
    }
  }, [isDictationTranslateMode, setWordDisplayConfig, setWordDictationConfig])

  useHotkeys(
    'ctrl+shift+v',
    () => {
      toggleDictationTranslateMode()
    },
    { enableOnFormTags: true, preventDefault: true },
    [toggleDictationTranslateMode],
  )

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip content="音效设置">
        <SoundSwitcher />
      </Tooltip>

      <Tooltip className="h-7 w-7" content="设置单个单词循环">
        <LoopWordSwitcher />
      </Tooltip>

      <Tooltip className="h-7 w-7" content={`看释义默写：放大中文释义，隐藏假名与单词（${'Ctrl'} + Shift + V）`}>
        <button
          className={`p-[2px] ${isDictationTranslateMode ? 'text-indigo-500' : 'text-gray-500'} text-lg focus:outline-none`}
          type="button"
          onClick={(e) => {
            toggleDictationTranslateMode()
            e.currentTarget.blur()
          }}
          aria-label="开关看释义默写模式"
        >
          {isDictationTranslateMode ? <IconLanguage /> : <IconLanguageOff />}
        </button>
      </Tooltip>

      <Tooltip content="错题本">
        <ErrorBookButton />
      </Tooltip>

      <Tooltip className="h-7 w-7" content="查看数据统计">
        <AnalysisButton />
      </Tooltip>

      <Tooltip className="h-7 w-7" content="开关深色模式">
        <button
          className={`p-[2px] text-lg text-indigo-500 focus:outline-none`}
          type="button"
          onClick={(e) => {
            changeDarkModeState()
            e.currentTarget.blur()
          }}
          aria-label="开关深色模式"
        >
          {isOpenDarkMode ? <IconMoon className="icon" /> : <IconSun className="icon" />}
        </button>
      </Tooltip>
      <Tooltip className="h-7 w-7" content="指法图示">
        <HandPositionIllustration></HandPositionIllustration>
      </Tooltip>
      <Tooltip content="设置">
        <Setting />
      </Tooltip>
    </div>
  )
}
