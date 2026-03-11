interface Props {
  propKey: string
  value: string
  onFilter?: (key: string, value: string) => void
}

export default function PropPill({ propKey, value, onFilter }: Props) {
  const handleClick = () => onFilter?.(propKey, value)
  return (
    <span
      onClick={handleClick}
      title={`${propKey}=${value}`}
      className={`inline-flex items-center rounded-[3px] overflow-hidden text-[11px] shrink-0 max-w-[220px] ${onFilter ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="bg-[#1a1a1a] text-gray-400 px-[5px] py-px rounded-l-[3px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
        {propKey}
      </span>
      <span className="bg-[#141414] text-gray-300 px-[5px] py-px rounded-r-[3px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
        {value}
      </span>
    </span>
  )
}
