// Build-only JSON files have explicit types so a fresh checkout can run typecheck.
// The build still generates and validates the real snapshot before exporting pages.
declare module '@/generated/catalog-public.json' {
  const snapshot: {
    products: Array<Omit<import('@/lib/catalog').Product, 'stock'>>;
    categories: import('@/lib/catalog').Category[];
    rentalConfig: import('@/lib/rental-pricing').RentalConfig | null;
  };
  export default snapshot;
}
declare module '@/generated/product-page-ids.json' {
  const ids: string[];
  export default ids;
}
