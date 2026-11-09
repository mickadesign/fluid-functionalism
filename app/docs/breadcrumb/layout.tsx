import { docMetadata } from "@/lib/docs/metadata";

export const metadata = docMetadata("breadcrumb");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
