import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/gallery-page";

export const metadata: Metadata = {
  title: "Explore — DotHub",
  description: "Browse dotfiles by tool, popularity, or newest submissions.",
};

export default function ExplorePage() {
  return <GalleryPage />;
}
