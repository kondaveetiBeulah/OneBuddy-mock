export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  discountTag: string;
  code?: string;
  image: string;
  backgroundColor: string;
  categoryId?: string;
}
