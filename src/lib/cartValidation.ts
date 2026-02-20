import { supabase } from './supabase'

interface CartItem {
  competitionId: string
  competitionTitle: string
  competitionSlug: string
  imageUrl: string
  quantity: number
  pricePerTicket: number
  totalPrice: number
}

interface ValidationResult {
  validItems: CartItem[]
  removedItems: Array<{
    item: CartItem
    reason: string
  }>
}

/**
 * Validates cart items against the database
 * Checks if competitions exist, are active, and prices are correct
 */
export async function validateCartItems(items: CartItem[]): Promise<ValidationResult> {
  const validItems: CartItem[] = []
  const removedItems: Array<{ item: CartItem; reason: string }> = []

  // If no items, return early
  if (items.length === 0) {
    return { validItems, removedItems }
  }

  // Get all competition IDs from cart
  const competitionIds = items.map((item) => item.competitionId)

  try {
    // Fetch all competitions from database in one query
    const { data: competitions, error } = await supabase
      .from('competitions')
      .select('id, title, slug, base_ticket_price_pence, status, max_tickets, tickets_sold')
      .in('id', competitionIds)

    if (error) {
      console.error('Error validating cart items:', error)
      // On error, keep all items (fail gracefully)
      return { validItems: items, removedItems }
    }

    // Create a map for fast lookup with calculated tickets_available
    const competitionMap = new Map(
      competitions?.map((comp) => [
        comp.id,
        {
          ...comp,
          tickets_available: comp.max_tickets - (comp.tickets_sold || 0),
        },
      ]) || []
    )

    // Validate each cart item
    for (const item of items) {
      const competition = competitionMap.get(item.competitionId)

      // Check if competition exists
      if (!competition) {
        removedItems.push({
          item,
          reason: 'Competition no longer exists',
        })
        continue
      }

      // Check if competition is active
      if (competition.status !== 'active') {
        removedItems.push({
          item,
          reason: `Competition is ${competition.status}`,
        })
        continue
      }

      // Check if enough tickets are available
      if (competition.tickets_available < item.quantity) {
        if (competition.tickets_available === 0) {
          removedItems.push({
            item,
            reason: 'No tickets available',
          })
          continue
        }
        // Adjust quantity if some tickets are available
        removedItems.push({
          item,
          reason: `Only ${competition.tickets_available} tickets available (you had ${item.quantity})`,
        })
        // Add item with adjusted quantity
        validItems.push({
          ...item,
          quantity: competition.tickets_available,
          totalPrice: (competition.base_ticket_price_pence / 100) * competition.tickets_available,
        })
        continue
      }

      // Check if price has changed
      const currentPriceGBP = competition.base_ticket_price_pence / 100
      if (Math.abs(currentPriceGBP - item.pricePerTicket) > 0.01) {
        // Price changed - update item with new price
        validItems.push({
          ...item,
          pricePerTicket: currentPriceGBP,
          totalPrice: currentPriceGBP * item.quantity,
          competitionTitle: competition.title, // Update title in case it changed
          competitionSlug: competition.slug, // Update slug in case it changed
        })
        continue
      }

      // Item is valid, keep it as-is
      validItems.push(item)
    }

    return { validItems, removedItems }
  } catch (error) {
    console.error('Unexpected error validating cart:', error)
    // On unexpected error, keep all items (fail gracefully)
    return { validItems: items, removedItems }
  }
}
