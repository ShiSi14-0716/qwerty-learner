import { isKanji } from '@/utils/kana'
import React, { useMemo } from 'react'

type NotationProps = {
  notation: string
  show?: boolean
  onToggle?: () => void
}

type NotationInfo = {
  word: string
  phonetic?: string
}

export default function Notation({ notation, show = true, onToggle }: NotationProps) {
  const infos: NotationInfo[] = useMemo(() => getNotationInfo(notation), [notation])

  if (!show) {
    return (
      <button
        type="button"
        onClick={(e) => {
          onToggle?.()
          e.currentTarget.blur()
        }}
        className="mb-2 cursor-pointer border-2 border-dashed border-gray-300 px-6 py-1 text-sm text-gray-400 transition-colors duration-300 hover:border-indigo-400 hover:text-indigo-500 focus:outline-none dark:border-gray-600 dark:text-gray-500"
      >
        假名已隐藏 · 点击显示
      </button>
    )
  }

  return (
    <div
      className="mx-auto flex cursor-pointer flex-col items-center"
      onClick={(e) => {
        onToggle?.()
        e.currentTarget.blur()
      }}
      title="点击隐藏假名"
    >
      <div className="flex h-20 items-end">
        <ruby className="mb-1 p-0 font-mono text-5xl text-gray-900 dark:text-gray-300">
          {infos.map(({ word, phonetic }, index) => (
            <React.Fragment key={index}>
              {word}
              {phonetic && phonetic.trim() !== '' && <rt>{phonetic}</rt>}
            </React.Fragment>
          ))}
        </ruby>
      </div>
    </div>
  )
}

const getNotationInfo = (notation: string): NotationInfo[] => {
  const re = /(.+?)\((.+?)\)/g
  let match
  let start = 0
  const ret: NotationInfo[] = []
  while ((match = re.exec(notation))) {
    const [fullMatch, wordMatch, phonetic] = match
    let word = wordMatch
    if (match.index > start) {
      ret.push({ word: notation.substring(start, match.index), phonetic: '' })
    }
    let kanjiStart = 0
    for (let i = 0; i < word.length; i++) {
      if (!isKanji(word[i])) {
        kanjiStart += 1
      } else if (kanjiStart > 0) {
        ret.push({
          word: word.substring(0, i),
          phonetic: ' ',
        })
        word = word.substring(i)
        break
      }
    }
    ret.push({
      word,
      phonetic,
    })
    start = match.index + fullMatch.length
  }
  if (start < notation.length) {
    ret.push({
      word: notation.substring(start),
      phonetic: '',
    })
  }
  return ret
}
