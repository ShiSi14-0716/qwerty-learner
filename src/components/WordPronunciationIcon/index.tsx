import { SoundIcon } from './SoundIcon'
import usePronunciationSound from '@/hooks/usePronunciation'
import type { Word } from '@/typings'
import { useCallback, useEffect, useImperativeHandle } from 'react'
import React from 'react'

export const WordPronunciationIcon = React.forwardRef<
  WordPronunciationIconRef,
  { word: Word; lang: string; className?: string; iconClassName?: string }
>(({ word, lang, className, iconClassName }, ref) => {
  // 从 notation 中提取假名注音（格式：汉字(假名)），用于日语发音兜底
  const extractKanaFromNotation = (notation: string): string => {
    if (!notation) return ''
    const match = notation.match(/\(([^)]+)\)/)
    if (match) return match[1]
    // 没有括号时，notation 本身可能就是假名或外来语
    return notation
  }

  // 从 notation 中提取带汉字的完整原文（移除括号内的假名注音，保留汉字与送假名）
  // 例如：「相容(あいい)れない」→「相容れない」，「無い(ない)」→「無い」
  // 用原文发音可让 TTS 按汉字自动读正确读音，比纯假名/罗马音更准
  const extractKanjiFromNotation = (notation: string): string => {
    if (!notation) return ''
    const cleaned = notation.replace(/[（(][^）)]*[）)]/g, '').trim()
    return cleaned || ''
  }

  const currentWord = () => {
    if (lang === 'hapin') {
      if (/[\u0400-\u04FF]/.test(word.notation || '')) {
        // 哈萨克语西里尔文字
        return word.notation || ''
      } else {
        // 哈萨克语老文字
        return word.trans[2]
      }
    } else if (lang === 'romaji' || lang === 'ja') {
      // 日语：优先用带汉字的原文发音（TTS 自动读正确读音），无汉字时退回假名注音
      const kanji = extractKanjiFromNotation(word.notation || '')
      if (kanji) return kanji
      const kana = extractKanaFromNotation(word.notation || '')
      return kana || word.name
    } else {
      return word.name
    }
  }
  const { play, stop, isPlaying } = usePronunciationSound(currentWord())

  const playSound = useCallback(() => {
    stop()
    play()
  }, [play, stop])

  useEffect(() => {
    return stop
  }, [word, stop])

  useImperativeHandle(
    ref,
    () => ({
      play: playSound,
    }),
    [playSound],
  )

  return (
    <SoundIcon
      animated={isPlaying}
      onClick={playSound}
      className={`cursor-pointer text-gray-600 ${className}`}
      iconClassName={iconClassName}
    />
  )
})

WordPronunciationIcon.displayName = 'WordPronunciationIcon'

export type WordPronunciationIconRef = {
  play: () => void
}
