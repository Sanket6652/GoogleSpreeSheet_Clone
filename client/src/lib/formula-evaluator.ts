import type { Cell } from "@/components/spreadsheet"

// Helper function to get cell reference from string like "A1", "B2", etc.
const getCellReference = (ref: string): { row: number; col: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null

  const colStr = match[1]
  const rowStr = match[2]

  let colIndex = 0
  for (let i = 0; i < colStr.length; i++) {
    colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64)
  }

  return {
    row: Number.parseInt(rowStr) - 1,
    col: colIndex - 1,
  }
}

// Helper function to get cell value from reference
const getCellValue = (ref: string, data: Cell[][]): number | string => {
  const cellRef = getCellReference(ref)
  if (!cellRef) return 0

  const { row, col } = cellRef

  if (row < 0 || row >= data.length || col < 0 || col >= data[0].length) {
    return 0
  }

  const cellValue = data[row][col].value

  // Try to convert to number if possible
  const numValue = Number.parseFloat(cellValue)
  return isNaN(numValue) ? cellValue : numValue
}

// Helper function to get range of cells
const getCellRange = (range: string, data: Cell[][]): (number | string)[] => {
  const [start, end] = range.split(":")
  const startRef = getCellReference(start)
  const endRef = getCellReference(end)

  if (!startRef || !endRef) return []

  const values: (number | string)[] = []

  for (let row = Math.min(startRef.row, endRef.row); row <= Math.max(startRef.row, endRef.row); row++) {
    for (let col = Math.min(startRef.col, endRef.col); col <= Math.max(startRef.col, endRef.col); col++) {
      if (row >= 0 && row < data.length && col >= 0 && col < data[0].length) {
        const cellValue = data[row][col].value
        const numValue = Number.parseFloat(cellValue)
        values.push(isNaN(numValue) ? cellValue : numValue)
      }
    }
  }

  return values
}

// Function to evaluate SUM
const evaluateSum = (args: string, data: Cell[][]): number => {
  if (args.includes(":")) {
    // Range of cells
    const values = getCellRange(args, data)
    return values.reduce<number>((sum, val) => sum + (typeof val === "number" ? val : 0), 0)
  } else {
    // Comma-separated list of cells
    const cells = args.split(",").map((cell) => cell.trim())
    return cells.reduce((sum, cell) => {
      const value = getCellValue(cell, data)
      return sum + (typeof value === "number" ? value : 0)
    }, 0)
  }
}

// Function to evaluate AVERAGE
const evaluateAverage = (args: string, data: Cell[][]): number => {
  if (args.includes(":")) {
    // Range of cells
    const values = getCellRange(args, data)
    const numValues = values.filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? numValues.reduce((sum, val) => sum + val, 0) / numValues.length : 0
  } else {
    // Comma-separated list of cells
    const cells = args.split(",").map((cell) => cell.trim())
    const numValues = cells.map((cell) => getCellValue(cell, data)).filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? numValues.reduce((sum, val) => sum + val, 0) / numValues.length : 0
  }
}

// Function to evaluate MAX
const evaluateMax = (args: string, data: Cell[][]): number => {
  if (args.includes(":")) {
    // Range of cells
    const values = getCellRange(args, data)
    const numValues = values.filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? Math.max(...numValues) : 0
  } else {
    // Comma-separated list of cells
    const cells = args.split(",").map((cell) => cell.trim())
    const numValues = cells.map((cell) => getCellValue(cell, data)).filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? Math.max(...numValues) : 0
  }
}

// Function to evaluate MIN
const evaluateMin = (args: string, data: Cell[][]): number => {
  if (args.includes(":")) {
    // Range of cells
    const values = getCellRange(args, data)
    const numValues = values.filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? Math.min(...numValues) : 0
  } else {
    // Comma-separated list of cells
    const cells = args.split(",").map((cell) => cell.trim())
    const numValues = cells.map((cell) => getCellValue(cell, data)).filter((val) => typeof val === "number") as number[]
    return numValues.length > 0 ? Math.min(...numValues) : 0
  }
}

// Function to evaluate COUNT
const evaluateCount = (args: string, data: Cell[][]): number => {
  if (args.includes(":")) {
    // Range of cells
    const values = getCellRange(args, data)
    return values.filter((val) => typeof val === "number").length
  } else {
    // Comma-separated list of cells
    const cells = args.split(",").map((cell) => cell.trim())
    return cells.map((cell) => getCellValue(cell, data)).filter((val) => typeof val === "number").length
  }
}

// Function to evaluate TRIM
const evaluateTrim = (args: string, data: Cell[][]): string => {
  const cellRef = args.trim()
  const value = getCellValue(cellRef, data)
  return typeof value === "string" ? value.trim() : value.toString()
}

// Function to evaluate UPPER
const evaluateUpper = (args: string, data: Cell[][]): string => {
  const cellRef = args.trim()
  const value = getCellValue(cellRef, data)
  return typeof value === "string" ? value.toUpperCase() : value.toString().toUpperCase()
}

// Function to evaluate LOWER
const evaluateLower = (args: string, data: Cell[][]): string => {
  const cellRef = args.trim()
  const value = getCellValue(cellRef, data)
  return typeof value === "string" ? value.toLowerCase() : value.toString().toLowerCase()
}

// Main function to evaluate formulas
export const evaluateFormula = (formula: string, data: Cell[][]): string | number => {
  // Remove the equals sign
  const expression = formula.substring(1).trim()

  // Check for functions
  const sumMatch = expression.match(/^SUM$$(.*)$$$/i)
  console.log(sumMatch)
  if (sumMatch) {

    return evaluateSum(sumMatch[1], data)
  }

  const averageMatch = expression.match(/^AVERAGE$$(.*)$$$/i)
  if (averageMatch) {
    return evaluateAverage(averageMatch[1], data)
  }

  const maxMatch = expression.match(/^MAX$$(.*)$$$/i)
  if (maxMatch) {
    return evaluateMax(maxMatch[1], data)
  }

  const minMatch = expression.match(/^MIN$$(.*)$$$/i)
  if (minMatch) {
    return evaluateMin(minMatch[1], data)
  }

  const countMatch = expression.match(/^COUNT$$(.*)$$$/i)
  if (countMatch) {
    return evaluateCount(countMatch[1], data)
  }

  const trimMatch = expression.match(/^TRIM$$(.*)$$$/i)
  if (trimMatch) {
    return evaluateTrim(trimMatch[1], data)
  }

  const upperMatch = expression.match(/^UPPER$$(.*)$$$/i)
  if (upperMatch) {
    return evaluateUpper(upperMatch[1], data)
  }

  const lowerMatch = expression.match(/^LOWER$$(.*)$$$/i)
  if (lowerMatch) {
    return evaluateLower(lowerMatch[1], data)
  }

  // If it's a simple cell reference
  if (/^[A-Z]+\d+$/.test(expression)) {
    return getCellValue(expression, data)
  }

  // If it's a simple arithmetic expression
  try {
    // Replace cell references with their values
    const processedExpression = expression.replace(/[A-Z]+\d+/g, (match) => {
      const value = getCellValue(match, data)
      return typeof value === "number" ? value.toString() : `"${value}"`
    })

    // Evaluate the expression
    // Note: This is a simple approach and has security implications in a real app
    // eslint-disable-next-line no-eval
    return eval(processedExpression)
  } catch (error) {
    return "#ERROR!"
  }
}

