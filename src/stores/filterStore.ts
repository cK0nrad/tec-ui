import { create } from 'zustand'

type FilterStore = {
    filter: string,
    setFilter: (filter: string) => void;



}

const useFilterStore = create<FilterStore>((set) => ({
    filter: "",
    setFilter: (filter: string) => set({
        filter
    })
}))

export default useFilterStore;
