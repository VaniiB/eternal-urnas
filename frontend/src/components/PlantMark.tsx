export function PlantMark({ slug, name, className = '' }: { slug: string; name: string; className?: string }) {
  return <img src={`/plants/${slug}.jpg`} alt={name} className={`object-cover ${className}`} />
}
