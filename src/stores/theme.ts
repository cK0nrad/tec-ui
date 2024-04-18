"use client";
import { create } from 'zustand'

type ThemeStore = {
    theme: 'light' | 'dark'
    setDark: () => void;
    setLight: () => void;
    bgColor: string,
    textColor: string
}

const useThemeStore = create<ThemeStore>((set) => {
    let currentTheme = false;
    if (typeof window !== "undefined") {
        currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    return ({
        theme: currentTheme ? "dark" : "light",
        bgColor: currentTheme ? "#110F0D" : "#eef0f2",
        textColor: currentTheme ? "#fff" : "#000",
        setDark: () => set({ theme: 'dark', bgColor: "#110F0D", textColor: "#fff" }),
        setLight: () => set({ theme: 'light', bgColor: "#eef0f2", textColor: "#000" })
    })
})

export default useThemeStore;
