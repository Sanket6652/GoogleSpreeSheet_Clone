"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import SpreadsheetGrid from "./spreadsheet-grid";
import { evaluateFormula } from "@/lib/formula-evaluator";
import FormulaBar from "./formula-bar";

// Define the cell type
export type Cell = {
  value: string;
  formula: string;
  style: {
    bold: boolean;
    italic: boolean;
    align: "left" | "center" | "right";
    color: string;
    backgroundColor: string;
    fontSize: number;
  };
};

// Initialize an empty cell
const createEmptyCell = (): Cell => ({
  value: "",
  formula: "",
  style: {
    bold: false,
    italic: false,
    align: "left",
    color: "#000000",
    backgroundColor: "#ffffff",
    fontSize: 14,
  },
});

// Initialize the spreadsheet data
const initializeData = (rows: number, cols: number): Cell[][] => {
  const data: Cell[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(createEmptyCell());
    }
    data.push(row);
  }
  return data;
};

export default function Spreadsheet() {
  const [data, setData] = useState<Cell[][]>(initializeData(100, 26));
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
console.log(selectedCell)
  const [activeFormula, setActiveFormula] = useState<string>("");
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Function to update a cell's value and formula
  const updateCell = (
    row: number,
    col: number,
    value: string,
    formula = ""
  ) => {
    const newData = [...data];
    newData[row][col] = {
      ...newData[row][col],
      value,
      formula,
    };
    setData(newData);
     // console.log(newData)
    // Update dependent cells if this cell is referenced in formulas
    updateDependentCells(newData);
  };

  // Function to update cells that depend on changed cells
  const updateDependentCells = (currentData: Cell[][]) => {
    const updatedData = [...currentData];

    // Iterate through all cells to find and update formulas
    for (let i = 0; i < updatedData.length; i++) {
      for (let j = 0; j < updatedData[i].length; j++) {
        const cell = updatedData[i][j];
        console.log(cell)
        if (cell.formula && cell.formula.startsWith("=")) {
          try {
            const result = evaluateFormula(cell.formula, updatedData)
            updatedData[i][j] = {
              ...cell,
              value: result.toString(),
            }
            console.log(result)
          } catch (error) {
            updatedData[i][j] = {
              ...cell,
              value: "#ERROR!",
            };
          }
        }
      }
    }

    setData(updatedData);
  };

  // Function to update cell styling
  const updateCellStyle = (style: Partial<Cell["style"]>) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const newData = [...data];
    newData[row][col] = {
      ...newData[row][col],
      style: {
        ...newData[row][col].style,
        ...style,
      },
    };
    setData(newData);
  };

  // Function to add a new row
  const addRow = () => {
    if (!selectedCell) return;

    const { row } = selectedCell;
    const newData = [...data];
    const newRow = Array(newData[0].length)
      .fill(null)
      .map(() => createEmptyCell());
    newData.splice(row + 1, 0, newRow);
    setData(newData);
  };

  // Function to delete a row
  const deleteRow = () => {
    if (!selectedCell || data.length <= 1) return;

    const { row } = selectedCell;
    const newData = [...data];
    newData.splice(row, 1);
    setData(newData);
    setSelectedCell(null);
  };

  // Function to add a new column
  const addColumn = () => {
    if (!selectedCell) return;

    const { col } = selectedCell;
    const newData = data.map((row) => {
      const newRow = [...row];
      newRow.splice(col + 1, 0, createEmptyCell());
      return newRow;
    });
    setData(newData);
  };

  // Function to delete a column
  const deleteColumn = () => {
    if (!selectedCell || data[0].length <= 1) return;

    const { col } = selectedCell;
    const newData = data.map((row) => {
      const newRow = [...row];
      newRow.splice(col, 1);
      return newRow;
    });
    setData(newData);
    setSelectedCell(null);
  };

  // Function to handle find and replace
  const handleFindReplace = () => {
    if (!findText) return;

    const newData = data.map((row) =>
      row.map((cell) => {
        if (cell.value.includes(findText)) {
          const newValue = cell.value.replaceAll(findText, replaceText);
          return {
            ...cell,
            value: newValue,
            formula: cell.formula.startsWith("=") ? cell.formula : newValue,
          };
        }
        return cell;
      })
    );

    setData(newData);
    setFindReplaceOpen(false);
  };

  // Function to remove duplicate rows
  const removeDuplicates = () => {
    if (!selectedCell) return;

    // Get unique rows based on their string representation
    const uniqueRows = new Map();
    data.forEach((row, index) => {
      const rowString = JSON.stringify(row.map((cell) => cell.value));
      if (!uniqueRows.has(rowString)) {
        uniqueRows.set(rowString, row);
      }
    });

    const newData = Array.from(uniqueRows.values());
    setData(newData);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="bg-white border-b flex items-center p-1 gap-1">
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updateCellStyle({
                      bold: !data[selectedCell?.row || 0][
                        selectedCell?.col || 0
                      ].style.bold,
                    })
                  }
                  disabled={!selectedCell}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updateCellStyle({
                      italic:
                        !data[selectedCell?.row || 0][selectedCell?.col || 0]
                          .style.italic,
                    })
                  }
                  disabled={!selectedCell}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateCellStyle({ align: "left" })}
                  disabled={!selectedCell}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateCellStyle({ align: "center" })}
                  disabled={!selectedCell}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateCellStyle({ align: "right" })}
                  disabled={!selectedCell}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                disabled={!selectedCell}
              >
                Font Size <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="grid gap-2">
                {[10, 12, 14, 16, 18, 20, 24].map((size) => (
                  <Button
                    key={size}
                    variant="ghost"
                    onClick={() => updateCellStyle({ fontSize: size })}
                  >
                    {size}px
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                disabled={!selectedCell}
              >
                Text Color <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="grid grid-cols-5 gap-2">
                {[
                  "#000000",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#808080",
                  "#800000",
                  "#808000",
                ].map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    className="w-6 h-6 p-0"
                    style={{ backgroundColor: color }}
                    onClick={() => updateCellStyle({ color })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addRow}
                  disabled={!selectedCell}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Row</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deleteRow}
                  disabled={!selectedCell}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Row</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Row</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addColumn}
                  disabled={!selectedCell}
                >
                  <Plus className="h-4 w-4 rotate-90" />
                  <span className="sr-only">Add Column</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deleteColumn}
                  disabled={!selectedCell}
                >
                  <Trash2 className="h-4 w-4 rotate-90" />
                  <span className="sr-only">Delete Column</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Column</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Search className="h-4 w-4" />
                Find & Replace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Find and Replace</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="find" className="text-right">
                    Find
                  </Label>
                  <Input
                    id="find"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="replace" className="text-right">
                    Replace with
                  </Label>
                  <Input
                    id="replace"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleFindReplace}>Replace All</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={removeDuplicates}
          >
            Remove Duplicates
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Functions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">SUM</SelectItem>
              <SelectItem value="average">AVERAGE</SelectItem>
              <SelectItem value="max">MAX</SelectItem>
              <SelectItem value="min">MIN</SelectItem>
              <SelectItem value="count">COUNT</SelectItem>
              <SelectItem value="trim">TRIM</SelectItem>
              <SelectItem value="upper">UPPER</SelectItem>
              <SelectItem value="lower">LOWER</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formula Bar */}
      <FormulaBar
        value={
          selectedCell
            ? data[selectedCell.row][selectedCell.col].formula ||
              data[selectedCell.row][selectedCell.col].value
            : ""
        }
        onChange={(value) => {
          if (selectedCell) {
            if (value.startsWith("=")) {
              try {
                const result = evaluateFormula(value, data);
                updateCell(
                  selectedCell.row,
                  selectedCell.col,
                  result.toString(),
                  value
                );
              } catch (error) {
                updateCell(
                  selectedCell.row,
                  selectedCell.col,
                  "#ERROR!",
                  value
                );
              }
            } else {
              updateCell(selectedCell.row, selectedCell.col, value);
            }
          }
        }}
        selectedCell={selectedCell}
      />

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-green-50">
        <SpreadsheetGrid
          data={data}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          onUpdateCell={updateCell}
        />
      </div>
    </div>
  );
}
