import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCompetitions } from '@/hooks/useCompetitions'
import CompetitionCard from '@/components/CompetitionCard'
import CustomDropdown from '@/components/common/CustomDropdown'

type Category = 'all' | 'Toys & Tech' | 'Baby & Nursery' | 'Cash' | 'Travel & Getaways' | 'Instant Wins' | 'Other'
type SortOption = 'featured' | 'newest' | 'ending_soon' | 'price_low' | 'price_high'

export default function AllCompetitionsSection() {
  const { competitions, isLoading } = useCompetitions()
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [displayCount] = useState(8)

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Toys & Tech', label: 'Toys & Tech' },
    { value: 'Baby & Nursery', label: 'Baby & Nursery' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Travel & Getaways', label: 'Travel & Getaways' },
    { value: 'Instant Wins', label: 'Instant Wins' },
    { value: 'Other', label: 'Other' }
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest added' },
    { value: 'ending_soon', label: 'Ending soon' },
    { value: 'price_low', label: 'Entry price: Low to High' },
    { value: 'price_high', label: 'Entry price: High to Low' }
  ]

  const filteredAndSortedCompetitions = useMemo(() => {
    let filtered = [...competitions]

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Instant Wins') {
        filtered = filtered.filter((comp) =>
          comp.competition_type === 'instant_win' ||
          comp.competition_type === 'instant_win_with_end_prize'
        )
      } else {
        filtered = filtered.filter((comp) => comp.category === selectedCategory)
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'ending_soon':
          return new Date(a.end_datetime).getTime() - new Date(b.end_datetime).getTime()
        case 'price_low':
          return a.base_ticket_price_pence - b.base_ticket_price_pence
        case 'price_high':
          return b.base_ticket_price_pence - a.base_ticket_price_pence
        default:
          return 0
      }
    })

    return filtered
  }, [competitions, selectedCategory, sortBy])

  const displayedCompetitions = filteredAndSortedCompetitions.slice(0, displayCount)
  const hasMore = filteredAndSortedCompetitions.length > displayCount

  if (isLoading || competitions.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20 relative overflow-hidden border-y" style={{
      background: 'linear-gradient(to bottom right, #FBEFDF, #fffbf7, rgba(157, 180, 184, 0.1))',
      borderColor: '#f0e0ca'
    }}>
      {/* Decorative blur circles */}
      <div
        className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: '#FED0B9' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: '#9DB4B8' }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg mb-3 sm:mb-4 shadow-sm"
            style={{ backgroundColor: 'rgba(73, 107, 113, 0.1)', color: '#496B71' }}
          >
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">VIEW COMPETITIONS</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
          >
            All Competitions
          </h2>

          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-5 sm:mb-6 px-4" style={{ color: '#78716c' }}>
            Browse all live competitions across BabyBets. Select the competition prize you'd like to win and secure your tickets. Good luck!
          </p>

          <Link to="/competitions">
            <button
              className="inline-flex items-center justify-center rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: '#496B71',
                borderWidth: '2px',
                borderColor: '#496B71'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#496B71'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#496B71'
              }}
            >
              View All Competitions
              <ArrowRight size={16} className="sm:hidden ml-2" />
              <ArrowRight size={18} className="hidden sm:block ml-2" />
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-5 sm:mb-6">
          {/* Sort Dropdown */}
          <div className="flex justify-end mb-4">
            <CustomDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={sortOptions}
            />
          </div>

          {/* Category Chips - Scrollable on mobile */}
          <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0">
            <div className="flex gap-2 px-4 sm:px-0 min-w-max sm:min-w-0 sm:flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: selectedCategory === category.value ? '#496B71' : 'white',
                    color: selectedCategory === category.value ? 'white' : '#78716c',
                    borderWidth: '1px',
                    borderColor: selectedCategory === category.value ? '#496B71' : '#e7e5e4'
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Competition Grid - 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
          {displayedCompetitions.map((competition) => (
            <div key={competition.id}>
              <CompetitionCard
                competition={{
                  ...competition,
                  images: (competition.images as string[]) || []
                }}
              />
            </div>
          ))}
        </div>

        {/* View All Competitions Button */}
        {hasMore && (
          <div className="text-center">
            <Link to="/competitions">
              <button
                className="inline-flex items-center justify-center rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: '#496B71',
                  borderWidth: '2px',
                  borderColor: '#496B71'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#496B71'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#496B71'
                }}
              >
                View All Competitions
                <ArrowRight size={16} className="sm:hidden ml-2" />
                <ArrowRight size={18} className="hidden sm:block ml-2" />
              </button>
            </Link>
          </div>
        )}

        {/* No results message */}
        {filteredAndSortedCompetitions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base sm:text-lg" style={{ color: '#78716c' }}>
              No competitions found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
