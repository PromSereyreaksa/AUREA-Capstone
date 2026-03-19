export interface GalleryItem {
  id: number;
  title: string;
  image: string;
  name: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
  onItemClick?: (item: GalleryItem) => void;
}

export const GalleryGrid = ({ items, onItemClick }: GalleryGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
      {items.map((item) => (
        <div
          key={item.id}
          className="cursor-pointer rounded-2xl overflow-hidden border-2 border-black bg-gray-100 shadow-[3px_3px_0_#1a1a1a]"
          onClick={() => onItemClick?.(item)}
        >
          <div className="aspect-video relative overflow-hidden">
            <img
              src={item.image || "/1.jpg"}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/1.jpg')) {
                  target.src = '/1.jpg';
                }
              }}
            />
            <div className="absolute inset-x-0 bottom-0 border-t-2 border-black bg-[#FFFEF9] px-4 py-3 text-left">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#FB8500]">
                {item.name}
              </div>
              <div className="text-xl font-black leading-tight text-black">
                {item.title}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
