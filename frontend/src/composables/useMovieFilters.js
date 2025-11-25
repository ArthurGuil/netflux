import { ref, computed } from 'vue'

export function useMovieFilters(movies) {
    const searchQuery = ref('')
    const selectedGenres = ref([])
    const typeFilter = ref('')

    // Mapping pour afficher les types
    const typeLabels = {
        movie: 'Films',
        series: 'Séries'
    }

    const filteredMovies = computed(() => {
        return movies.value.filter(movie => {
            const matchesSearch = movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())

            const matchesType = typeFilter.value
                ? movie.type === typeFilter.value
                : true

            const matchesGenres =
                selectedGenres.value.length === 0
                    ? true
                    : selectedGenres.value.every(selected =>
                        movie.genres?.map(g => g.name).includes(selected)
                    )

            return matchesSearch && matchesType && matchesGenres
        })
    })

    const typeOptions = computed(() =>
        [...new Set(movies.value.map(m => m.type).filter(Boolean))]
    )

    const resetFilters = () => {
        searchQuery.value = ''
        typeFilter.value = ''
        selectedGenres.value = []
    }

    const typeLabel = (type) => typeLabels[type] ?? type

    return {
        searchQuery,
        selectedGenres,
        typeFilter,
        filteredMovies,
        typeOptions,
        resetFilters,
        typeLabel
    }
}
