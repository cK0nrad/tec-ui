"use client";
import { create } from 'zustand'

type ThemeStore = {
    switchTheme(): void
    theme: ThemeList
}

type ThemeList = 'dark' | 'light'

type Theme = {
    bgColor: string,
    textColor: string
}

const darkTheme: Theme = {
    bgColor: "#110F0D",
    textColor: "#fff"
}

const lightTheme: Theme = {
    bgColor: "#eef0f2",
    textColor: "#000"
}


export const getTheme = (theme: ThemeList) => {
    return theme == "dark" ? { ...darkTheme } : { ...lightTheme }
}

const useThemeStore = create<ThemeStore>((set) => ({
    theme: "light",
    switchTheme: () => set(({ theme }) => ({ theme: theme == "dark" ? "light" : "dark" }))
}))

export default useThemeStore;
