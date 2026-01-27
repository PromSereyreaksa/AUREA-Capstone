interface GalleryItem {
  id: number;
  title: string;
  image: string;
  name: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
}

export const GalleryGrid = ({ items }: GalleryGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
      {items.map((item) => (
        <div
          key={item.id}
          className="group cursor-pointer border-3 border-black rounded-2xl overflow-hidden bg-black transition-transform duration-300"
        >
          <div className="aspect-video relative overflow-hidden">
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* hover dark-overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300" />
            {/* when hover: show name and title from item */}
            <div className="absolute left-4 bottom-4 z-10 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-white text-sm font-normal">{item.name}</div>
              <div className="text-white text-xl leading-tight">
                {item.title}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
