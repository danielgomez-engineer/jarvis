"use client";

import { createContext, useContext } from "react";
import { Area, TaskActions } from "./types";

//=====JV-1 (U2.6.1): DATA EVERY CARD NEEDS, WITHOUT PASSING IT THROUGH 4 LEVELS=====
// Before, the actions travelled page → grid → lane → cell → card as props. The task menu
// also needs the areas and "today", so they now live in a context that any card can read.

type BoardContextValue = {
  areas: Area[];
  // "YYYY-MM-DD" in the person's time zone
  today: string;
  taskActions: TaskActions;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ value, children }: { value: BoardContextValue; children: React.ReactNode }) {
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard(): BoardContextValue {
  const board = useContext(BoardContext);
  if (!board) throw new Error("useBoard must be used inside <BoardProvider>");
  return board;
}
