-- Grant execute permission on atomic ticket claiming function
GRANT EXECUTE ON FUNCTION public.claim_tickets_atomic(UUID, UUID, UUID, INTEGER) TO service_role;
