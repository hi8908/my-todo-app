import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "議事録詳細",
};

export default function MinutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
