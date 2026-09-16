import AnalysisButton from '../AnalysisButton'
import LoopWordSwitcher from '../LoopWordSwitcher'
import Setting from '../Setting'
import Tooltip from '@/components/Tooltip'
import { pronunciationConfigAtom, wordDictationConfigAtom, wordDisplayConfigAtom } from '@/store'
import { useAtom } from 'jotai'
import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import IconSpeakerWave from '~icons/heroicons/speaker-wave-solid'
import IconSpeakerXMark from '~icons/heroicons/speaker-x-mark-solid'
import IconLanguage from '~icons/tabler/language'
import IconLanguageOff from '~icons/tabler/language-off'

export default function Switcher() {
  const [wordDisplayConfig, setWordDisplayConfig] = useAtom(wordDisplayConfigAtom)
  const [wordDictationConfig, setWordDictationConfig] = useAtom(wordDictationConfigAtom)
  const [pronunciationConfig, setPronunciationConfig] = useAtom(pronunciationConfigAtom)

  // 看释义默写模式：放大中文释义，隐藏假名与单词，凭中文回想输入罗马音
  const isDictationTranslateMode = wordDisplayConfig.enlargeTranslation && wordDictationConfig.isOpen

  // 音量图标：直接开关单词发音
  const togglePronunciation = useCallback(() => {
    setPronunciationConfig((old) => ({ ...old, isOpen: !old.isOpen }))
  }, [setPronunciationConfig])

  // 看释义默写模式与原文模式之间切换，各自按默认显示/发音设置
  const toggleDictationTranslateMode = useCallback(() => {
    if (isDictationTranslateMode) {
      // 退出：回到原文模式，默认显示原文+释义，默认发音
      setWordDisplayConfig((old) => ({ ...old, showNotation: true, showTranslation: true, enlargeTranslation: false }))
      setWordDictationConfig((old) => ({ ...old, isOpen: false }))
      setPronunciationConfig((old) => ({ ...old, isOpen: true }))
    } else {
      // 进入：看释义默写，隐藏原文与罗马音，不发音
      setWordDisplayConfig((old) => ({ ...old, showNotation: false, showTranslation: true, enlargeTranslation: true }))
      setWordDictationConfig((old) => ({ ...old, isOpen: true, type: 'hideAll' }))
      setPronunciationConfig((old) => ({ ...old, isOpen: false }))
    }
  }, [isDictationTranslateMode, setWordDisplayConfig, setWordDictationConfig, setPronunciationConfig])

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
      <Tooltip className="h-7 w-7" content={`${pronunciationConfig.isOpen ? '关闭' : '开启'}单词发音`}>
        <button
          className={`p-[2px] text-lg focus:outline-none ${pronunciationConfig.isOpen ? 'text-indigo-500' : 'text-gray-400'}`}
          type="button"
          onClick={(e) => {
            togglePronunciation()
            e.currentTarget.blur()
          }}
          aria-label="开关单词发音"
        >
          {pronunciationConfig.isOpen ? <IconSpeakerWave className="icon" /> : <IconSpeakerXMark className="icon" />}
        </button>
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

      <Tooltip className="h-7 w-7" content="查看数据统计">
        <AnalysisButton />
      </Tooltip>

      <Tooltip content="设置">
        <Setting />
      </Tooltip>
    </div>
  )
}
