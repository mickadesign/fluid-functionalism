import { docMetadata } from "@/lib/docs/metadata";

export const metadata = docMetadata("calendar");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
