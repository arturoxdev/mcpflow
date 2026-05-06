export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="min-h-screen flex flex-col items-center px-6 py-10">{children}</main>
}
