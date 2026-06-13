import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Config — DotHub",
  description: "Share your dotfiles configuration with the DotHub community.",
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
