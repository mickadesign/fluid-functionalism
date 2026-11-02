import { docMetadata } from "@/lib/docs/metadata";

export const metadata = docMetadata("card");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
