"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Cell } from "./spreadsheet";

interface SpreadsheetGridProps {
  data: Cell[][];
  selectedCell: { row: number; col: number } | null;
  onSelectCell: (cell: { row: number; col: number } | null) => void;
  onUpdateCell: (
    row: number,
    col: number,
    value: string,
    formula?: string
  ) => void;
}

export default function SpreadsheetGrid({
  data,
  selectedCell,
  onSelectCell,
  onUpdateCell,
}: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragStart, setDragStart] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(
    null
  );
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [colWidths, setColWidths] = useState<number[]>(
    Array(data[0].length).fill(100)
  );
  const [rowHeights, setRowHeights] = useState<number[]>(
    Array(data.length).fill(24)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  // Convert column index to letter (A, B, C, ..., Z, AA, AB, ...)
  const colIndexToLetter = (index: number): string => {
    let letter = "";
    let temp = index;

    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }

    return letter;
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    console.log("fddf")
    onSelectCell({ row, col });
  };

  // Handle double click to edit cell
  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setEditValue(data[row][col].formula || data[row][col].value);

    // Focus the input after it's rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  // Handle cell edit completion
  const handleCellEditComplete = () => {
    if (editingCell) {
      const { row, col } = editingCell;

      if (editValue.startsWith("=")) {
        onUpdateCell(row, col, "", editValue);
      } else {
        onUpdateCell(row, col, editValue);
      }

      setEditingCell(null);
    }
  };

  // Handle key press in editing cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellEditComplete();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Handle mouse down for cell selection and dragging
  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    if (e.button !== 0) return; // Only handle left click

    setDragStart({ row, col });
    setDragEnd({ row, col });
    onSelectCell({ row, col });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent, row: number, col: number) => {
    if (dragStart && !editingCell) {
      setDragEnd({ row, col });
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle column resize start
  const handleColResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    setResizingCol(colIndex);
    startXRef.current = e.clientX;
    startWidthRef.current = colWidths[colIndex];

    document.addEventListener("mousemove", handleColResizeMove);
    document.addEventListener("mouseup", handleColResizeEnd);
  };

  // Handle column resize move
  const handleColResizeMove = useCallback(
    (e: MouseEvent) => {
      if (resizingCol === null) return;

      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + diff);

      const newColWidths = [...colWidths];
      newColWidths[resizingCol] = newWidth;
      setColWidths(newColWidths);
    },
    [colWidths, resizingCol]
  );

  // Handle column resize end
  const handleColResizeEnd = useCallback(() => {
    setResizingCol(null);
    document.removeEventListener("mousemove", handleColResizeMove);
    document.removeEventListener("mouseup", handleColResizeEnd);
  }, [handleColResizeMove]);

  // Handle row resize start
  const handleRowResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    setResizingRow(rowIndex);
    startYRef.current = e.clientY;
    startHeightRef.current = rowHeights[rowIndex];

    document.addEventListener("mousemove", handleRowResizeMove);
    document.addEventListener("mouseup", handleRowResizeEnd);
  };

  // Handle row resize move
  const handleRowResizeMove = useCallback(
    (e: MouseEvent) => {
      if (resizingRow === null) return;

      const diff = e.clientY - startYRef.current;
      const newHeight = Math.max(20, startHeightRef.current + diff);

      const newRowHeights = [...rowHeights];
      newRowHeights[resizingRow] = newHeight;
      setRowHeights(newRowHeights);
    },
    [rowHeights, resizingRow]
  );

  // Handle row resize end
  const handleRowResizeEnd = useCallback(() => {
    setResizingRow(null);
    document.removeEventListener("mousemove", handleRowResizeMove);
    document.removeEventListener("mouseup", handleRowResizeEnd);
  }, [handleRowResizeMove]);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleColResizeMove);
      document.removeEventListener("mouseup", handleColResizeEnd);
      document.removeEventListener("mousemove", handleRowResizeMove);
      document.removeEventListener("mouseup", handleRowResizeEnd);
    };
  }, [
    handleColResizeMove,
    handleColResizeEnd,
    handleRowResizeMove,
    handleRowResizeEnd,
  ]);

  return (
    <div
      className="relative overflow-auto"
      ref={gridRef}
      onMouseUp={handleMouseUp}
    >
      <table className="border-collapse table-fixed">
        <thead>
          <tr>
            <th className="w-10 h-6 bg-gray-100 border border-gray-300 sticky top-0 left-0 z-20"></th>
            {data[0].map((_, colIndex) => (
              <th
                key={colIndex}
                className="bg-gray-100 border border-gray-300 font-normal text-sm sticky top-0 z-10 select-none"
                style={{ width: colWidths[colIndex] }}
              >
                <div className="flex items-center justify-center relative">
                  {colIndexToLetter(colIndex)}
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                    // onMouseDown={(e) => handleColResizeStart(e, colIndex)}
                  ></div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ height: rowHeights[rowIndex] }}>
              <td className="bg-gray-100 border border-gray-300 text-center text-sm sticky left-0 z-10 select-none">
                <div className="flex items-center justify-center relative">
                  {rowIndex + 1}
                  <div
                    className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize"
                    // onMouseDown={(e) => handleRowResizeStart(e, rowIndex)}
                  ></div>
                </div>
              </td>
              {row.map((cell, colIndex) => {
                const isSelected =
                  selectedCell?.row === rowIndex &&
                  selectedCell?.col === colIndex;
                const isEditing =
                  editingCell?.row === rowIndex &&
                  editingCell?.col === colIndex;

                return (
                  <td
                    key={colIndex}
                    className={`border border-gray-300 relative ${
                      isSelected
                        ? "bg-blue-50  outline-2 outline-blue-500 z-10"
                        : ""
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onDoubleClick={() =>
                      handleCellDoubleClick(rowIndex, colIndex)
                    }
                    // onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                    // onMouseMove={(e) => handleMouseMove(e, rowIndex, colIndex)}
                    style={{
                      textAlign: cell.style.align,
                      fontWeight: cell.style.bold ? "bold" : "normal",
                      fontStyle: cell.style.italic ? "italic" : "normal",
                      color: cell.style.color,
                      backgroundColor: isSelected
                        ? undefined
                        : cell.style.backgroundColor,
                      fontSize: `${cell.style.fontSize}px`,
                      width: colWidths[colIndex],
                      height: rowHeights[rowIndex],
                    }}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        className="absolute inset-0 w-full h-full border-none outline-none p-1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditComplete}
                        onKeyDown={handleKeyPress}
                      />
                    ) : (
                      <div className="p-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {cell.value}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
