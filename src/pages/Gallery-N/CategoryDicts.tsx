import DictionaryComponent from './DictionaryWithoutCover'
import type { Dictionary } from '@/typings'

export default function DictionaryGroup({ dicts }: { dicts: Dictionary[] }) {
  return (
    <div>
      <div className="mt-8 grid gap-x-5 gap-y-10 px-1 pb-4 sm:grid-cols-1 md:grid-cols-2 dic3:grid-cols-3 dic4:grid-cols-4">
        {dicts.length > 0 ? (
          dicts.map((dict) => <DictionaryComponent key={dict.id} dictionary={dict} />)
        ) : (
          <div className="col-span-full text-center text-gray-500">当前分类下没有可用的词典</div>
        )}
      </div>
    </div>
  )
}
