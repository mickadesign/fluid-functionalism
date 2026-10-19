import { docMetadata } from "@/lib/docs/metadata";

export const metadata = docMetadata("tooltip");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
