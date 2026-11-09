import { docMetadata } from "@/lib/docs/metadata";

export const metadata = docMetadata("input");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
