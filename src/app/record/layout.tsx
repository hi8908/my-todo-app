import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新しい議事録を作成",
};

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
