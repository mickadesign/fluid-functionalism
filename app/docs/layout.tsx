export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-10 sm:py-16 w-full max-w-[680px] mx-auto mt-12 md:mt-0">
      {children}
    </div>
  );
}
