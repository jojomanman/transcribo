"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button" // Adjusted path

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "🌙" : "☀️"}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}