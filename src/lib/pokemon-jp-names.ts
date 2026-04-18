/**
 * Pokemon JP Name Mapper
 * 
 * Maps English Pokemon names to Japanese names using PokeAPI.
 * PokeAPI provides species names in multiple languages including Japanese.
 * 
 * Since PokeAPI uses Pokedex numbers, we first look up by English name,
 * then get the Japanese name from the species data.
 */

// Cache for JP names to avoid repeated API calls
const jpNameCache = new Map<string, string | null>()

/**
 * Get the Japanese name for a Pokemon species using PokeAPI.
 * Returns null if the name can't be found.
 */
export async function getJapanesePokemonName(englishName: string): Promise<string | null> {
  // Clean up the name - remove suffixes like "ex", "V", "VMAX", etc.
  const cleanName = englishName
    .replace(/\s+(ex|EX|V|VMAX|VSTAR|GX|V-UNION|V-STAR|break|BREAK|Mega|Primal|Spirit Link|RESTORED|★)$/i, '')
    .replace(/\s+(Stage\s+1|Stage\s+2)$/i, '')
    .trim()

  // Check cache first
  const cacheKey = cleanName.toLowerCase()
  if (jpNameCache.has(cacheKey)) {
    return jpNameCache.get(cacheKey)!
  }

  try {
    // Step 1: Look up Pokemon by name to get species URL
    const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${cacheKey}`, {
      headers: { 'User-Agent': 'TCGVault/1.0' },
      cache: 'no-store',
    })

    if (!pokemonRes.ok) {
      // Try direct species lookup
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${cacheKey}`, {
        headers: { 'User-Agent': 'TCGVault/1.0' },
        cache: 'no-store',
      })
      
      if (!speciesRes.ok) {
        jpNameCache.set(cacheKey, null)
        return null
      }

      const speciesData = await speciesRes.json()
      const jaName = speciesData.names?.find(
        (n: any) => n.language.name === 'ja'
      )?.name

      jpNameCache.set(cacheKey, jaName || null)
      return jaName || null
    }

    const pokemonData = await pokemonRes.json()
    const speciesUrl = pokemonData.species.url

    // Step 2: Get species data for Japanese name
    const speciesRes = await fetch(speciesUrl, {
      headers: { 'User-Agent': 'TCGVault/1.0' },
      cache: 'no-store',
    })

    if (!speciesRes.ok) {
      jpNameCache.set(cacheKey, null)
      return null
    }

    const speciesData = await speciesRes.json()
    const jaName = speciesData.names?.find(
      (n: any) => n.language.name === 'ja'
    )?.name

    // Add back the suffix if it was removed
    let result = jaName || null
    if (result) {
      const suffixMatch = englishName.match(/\s+(ex|EX|V|VMAX|VSTAR|GX)$/i)
      if (suffixMatch) {
        // For Japanese cards, suffixes are often kept in English or katakana
        const suffixMap: Record<string, string> = {
          'ex': 'EX',
          'EX': 'EX',
          'V': 'V',
          'VMAX': 'VMAX',
          'VSTAR': 'VSTAR',
          'GX': 'GX',
        }
        const suffix = suffixMap[suffixMatch[1]] || suffixMatch[1]
        result = `${result} ${suffix}`
      }
    }

    jpNameCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error(`[JP Name Mapper] Error fetching JP name for ${englishName}:`, error)
    jpNameCache.set(cacheKey, null)
    return null
  }
}

/**
 * Get the English name for a Japanese Pokemon name using PokeAPI.
 * Returns null if the name can't be found.
 */
const enNameCache = new Map<string, string | null>()

export async function getEnglishPokemonName(japaneseName: string): Promise<string | null> {
  // Clean up suffixes like EX, V, VMAX etc.
  const cleanJP = japaneseName
    .replace(/\s*(EX|V|VMAX|VSTAR|GX)$/i, '')
    .replace(/\s*ex$/i, '')
    .trim()

  const cacheKey = cleanJP
  if (enNameCache.has(cacheKey)) {
    return enNameCache.get(cacheKey)!
  }

  try {
    // PokeAPI species endpoint can search by ID or name
    // For JP names, we need to search differently
    // Use the Pokemon TCG API which accepts Japanese names in some cases
    // Or use a reverse lookup via PokeAPI's pokemon-species list
    
    // Strategy: Search Pokemon TCG API which may have JP name matches
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cleanJP)}&pageSize=1`, {
      headers: { 'User-Agent': 'TCGVault/1.0' },
      cache: 'no-store',
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.data?.[0]?.name) {
        // We got an EN name from the Pokemon TCG API
        enNameCache.set(cacheKey, data.data[0].name)
        return data.data[0].name
      }
    }

    enNameCache.set(cacheKey, null)
    return null
  } catch (error) {
    console.error(`[JP Name Mapper] Error getting EN name for ${cleanJP}:`, error)
    enNameCache.set(cacheKey, null)
    return null
  }
}

/**
 * Get Japanese names for multiple Pokemon at once.
 * Processes in batches to avoid rate limiting.
 */
export async function getJapanesePokemonNames(
  englishNames: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  
  // Process in batches of 5 with 200ms delay
  for (let i = 0; i < englishNames.length; i += 5) {
    const batch = englishNames.slice(i, i + 5)
    const promises = batch.map(async (name) => {
      const jpName = await getJapanesePokemonName(name)
      results.set(name, jpName)
    })
    await Promise.all(promises)
    
    // Small delay between batches
    if (i + 5 < englishNames.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}