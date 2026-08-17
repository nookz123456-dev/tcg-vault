import { redirect } from 'next/navigation'

// Vaultverse is a Marvel Hero Rush–only site now. The old multi-game search
// (Pokémon / One Piece) is retired; forward any query to the Marvel browser.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  redirect(q ? `/card/marvel?q=${encodeURIComponent(q)}` : '/card/marvel')
}
