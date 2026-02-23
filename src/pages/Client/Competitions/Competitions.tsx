import { useState, useMemo } from 'react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import PageSection from '@/components/common/PageSection'
import CompetitionCard from '@/components/CompetitionCard'
import CustomDropdown from '@/components/common/CustomDropdown'
import { useCompetitions } from '@/hooks/useCompetitions'
import { Loader, Search } from 'lucide-react'

type Category = 'all' | 'Toys' | 'Baby & Nursery' | 'Cash' | 'Instant Wins' | 'Other'
type CompetitionType = 'all' | 'standard' | 'instant_win' | 'instant_win_with_end_prize'
type SortOption = 'ending_soon' | 'featured' | 'price_low' | 'price_high' | 'newest'

export default function Competitions() {
  const { competitions, isLoading, error } = useCompetitions()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [selectedType, setSelectedType] = useState<CompetitionType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Toys', label: 'Toys' },
    { value: 'Baby & Nursery', label: 'Baby & Nursery' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Instant Wins', label: 'Instant Wins' },
    { value: 'Other', label: 'Other' }
  ]

  const competitionTypes: { value: CompetitionType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'standard', label: 'Standard Draw' },
    { value: 'instant_win', label: 'Instant Win' },
    { value: 'instant_win_with_end_prize', label: 'Instant + End Prize' }
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'featured', label: 'Featured' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' }
  ]

  const filteredAndSortedCompetitions = useMemo(() => {
    let filtered = [...competitions]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((comp) =>
        comp.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((comp) => comp.category === selectedCategory)
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((comp) => comp.competition_type === selectedType)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ending_soon':
          return new Date(a.end_datetime).getTime() - new Date(b.end_datetime).getTime()
        case 'featured':
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        case 'price_low':
          return a.base_ticket_price_pence - b.base_ticket_price_pence
        case 'price_high':
          return b.base_ticket_price_pence - a.base_ticket_price_pence
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [competitions, searchQuery, selectedCategory, selectedType, sortBy])

  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <section className="pt-4 pb-12 sm:pb-16">
        <PageSection
          title="All Competitions"
          description="Browse all our amazing competitions and win incredible prizes"
        />

        {/* Filters */}
        <div className="max-w-[1400px] mx-auto mt-6 sm:mt-8 px-4 sm:px-6 lg:px-12">
          {/* Search Bar, Type Dropdown, and Sort Dropdown */}
          <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#78716c' }} />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border cursor-text"
                style={{
                  borderColor: '#e7e5e4',
                  backgroundColor: 'white',
                  color: '#151e20'
                }}
              />
            </div>

            <CustomDropdown
              value={selectedType}
              onChange={(value) => setSelectedType(value as CompetitionType)}
              options={competitionTypes}
            />

            <CustomDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={sortOptions}
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-6 sm:mb-8 -mx-4 sm:mx-0">
            <div className="border-b" style={{ borderColor: '#e7e5e4' }}>
              <div className="flex overflow-x-auto no-scrollbar px-4 sm:px-0" style={{ scrollbarWidth: 'none' }}>
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer relative whitespace-nowrap"
                    style={{
                      color: selectedCategory === category.value ? '#151e20' : '#78716c',
                      borderBottom: selectedCategory === category.value ? '2px solid #151e20' : '2px solid transparent'
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Competition Cards */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <Loader className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" style={{ color: '#151e20' }} />
            </div>
          ) : error ? (
            <div className="text-center py-16 sm:py-20">
              <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
                Failed to load competitions. Please try again later.
              </p>
            </div>
          ) : filteredAndSortedCompetitions.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
                No competitions found matching your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {filteredAndSortedCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={{
                    ...competition,
                    images: Array.isArray(competition.images) ? (competition.images as string[]) : undefined
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
