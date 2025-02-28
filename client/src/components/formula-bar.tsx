"use client"

import { Input } from "@/components/ui/input"

interface FormulaBarProps {
  value: string
  onChange: (value: string) => void
  selectedCell: { row: number; col: number } | null
}

export default function FormulaBar({ value, onChange, selectedCell }: FormulaBarProps) {
  const cellAddress = selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : ""

  return (
    <div className="flex items-center border-b p-1 gap-2">
      <div className="bg-gray-100 px-2 py-1 text-sm font-medium rounded min-w-[40px] text-center">{cellAddress}</div>
      <div className="flex-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value or formula"
          className="border-gray-300"
        />
      </div>
    </div>
  )
}

