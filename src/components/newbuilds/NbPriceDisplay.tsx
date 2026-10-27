import { ProjectStartingPrice } from './ProjectStartingPrice';
interface Props {
  price: number | null;
  priceTo?: number | null;
  showFrom?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
/** Public project/unit preview: unconfirmed starting price, never a firm offer. */
export function NbPriceDisplay({ price, size = 'md', className = '' }: Props) {
  return <ProjectStartingPrice price={price} className={`${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'} ${className}`} />;
}
