"use client";

import { useState } from "react";
import { PortfolioHeader } from "./PortfolioHeader";
import { SearchBar } from "./SearchBar";
import { GalleryGrid } from "./GalleryGrid";
import { Pagination } from "./Pagination";

const galleryItems = [
  {
    id: 1,
    name: "sereyreaksa",
    title: "My best Portfolio",
    image:
      "https://images.unsplash.com/photo-1578282055671-61814c8f2e5e?w=500&h=400&fit=crop",
  },
  {
    id: 2,
    name: "ilong",
    title: "My worst Portfolio",
    image:
      "https://images.unsplash.com/photo-1516594915649-c945b9c922c8?w=500&h=400&fit=crop",
  },
  {
    id: 3,
    name: "bunheang",
    title: "hello sir",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=500&h=400&fit=crop",
  },
  {
    id: 4,
    name: "sophanith",
    title: "Young & Free",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&h=400&fit=crop",
  },
  {
    id: 5,
    name: "belly",
    title: "Abstract Ocean",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=400&fit=crop",
  },
  {
    id: 6,
    name: "hanuman",
    title: "Dark Wanderer",
    image:
      "https://images.unsplash.com/photo-1484693432045-dfb8e4c6d8c4?w=500&h=400&fit=crop",
  },
];

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <section className="px-6 py-12">
      <PortfolioHeader />
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <GalleryGrid items={galleryItems} />
      <Pagination />
    </section>
  );
}
