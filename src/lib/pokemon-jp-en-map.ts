// Pokemon JP ↔ EN Name Lookup Table
// Covers the most popular Pokemon to minimize API calls
// Source: PokeAPI + bulbapedia

export const JP_TO_EN: Record<string, string> = {
  // Gen 1 - Kanto
  'フシギダネ': 'Bulbasaur',
  'フシギソウ': 'Ivysaur',
  'フシギバナ': 'Venusaur',
  'ヒトカゲ': 'Charmander',
  'リザード': 'Charmeleon',
  'リザードン': 'Charizard',
  'ゼニガメ': 'Squirtle',
  'カメール': 'Wartortle',
  'カメックス': 'Blastoise',
  'キャタピー': 'Caterpie',
  'トランセル': 'Metapod',
  'バタフリー': 'Butterfree',
  'ビードル': 'Weedle',
  'コクーン': 'Kakuna',
  'スピアー': 'Beedrill',
  'ポッポ': 'Pidgey',
  'ピジョン': 'Pidgeotto',
  'ピジョット': 'Pidgeot',
  'コラッタ': 'Rattata',
  'ラッタ': 'Raticate',
  'オニスズメ': 'Spearow',
  'オニドリル': 'Fearow',
  'アーボ': 'Ekans',
  'アーボック': 'Arbok',
  'ピカチュウ': 'Pikachu',
  'ライチュウ': 'Raichu',
  'サンド': 'Sandshrew',
  'サンドパン': 'Sandslash',
  'ニドラン♀': 'Nidoran F',
  'ニドリーナ': 'Nidorina',
  'ニドクイン': 'Nidoqueen',
  'ニドラン♂': 'Nidoran M',
  'ニドリーノ': 'Nidorino',
  'ニドキング': 'Nidoking',
  'ピッピ': 'Clefairy',
  'ピクシー': 'Clefable',
  'ロコン': 'Vulpix',
  'キュウコン': 'Ninetales',
  'プリン': 'Jigglypuff',
  'プクリン': 'Wigglytuff',
  'ズバット': 'Zubat',
  'ゴルバット': 'Golbat',
  'ナゾノクサ': 'Oddish',
  'クサイハナ': 'Gloom',
  'ラフレシア': 'Vileplume',
  'パラス': 'Paras',
  'パラセクト': 'Parasect',
  'コンパン': 'Venonat',
  'モルフォン': 'Venomoth',
  'ディグダ': 'Diglett',
  'ダグトリオ': 'Dugtrio',
  'ニャース': 'Meowth',
  'ペルシアン': 'Persian',
  'コダック': 'Psyduck',
  'ゴルダック': 'Golduck',
  'マンキー': 'Mankey',
  'オコリザル': 'Primeape',
  'ガーディ': 'Growlithe',
  'ウインディ': 'Arcanine',
  'ニョロモ': 'Poliwag',
  'ニョロゾ': 'Poliwhirl',
  'ニョロボン': 'Poliwrath',
  'ケーシィ': 'Abra',
  'ユンゲラー': 'Kadabra',
  'フーディン': 'Alakazam',
  'ワンリキー': 'Machop',
  'ゴーリキー': 'Machoke',
  'カイリキー': 'Machamp',
  'マダツボミ': 'Bellsprout',
  'ウツドン': 'Weepinbell',
  'ウツボット': 'Victreebel',
  'メノクラゲ': 'Tentacool',
  'ドククラゲ': 'Tentacruel',
  'イシツブテ': 'Geodude',
  'ゴローン': 'Graveler',
  'ゴローニャ': 'Golem',
  'ポニータ': 'Ponyta',
  'ギャロップ': 'Rapidash',
  'ヤドン': 'Slowpoke',
  'ヤドラン': 'Slowbro',
  'コイル': 'Magnemite',
  'レアコイル': 'Magneton',
  'カモネギ': 'Farfetchd',
  'ドードー': 'Doduo',
  'ドードリオ': 'Dodrio',
  'パウワウ': 'Seel',
  'ジュゴン': 'Dewgong',
  'ベトベター': 'Grimer',
  'ベトベトン': 'Muk',
  'シェルダー': 'Shellder',
  'パルシェン': 'Cloyster',
  'ゴース': 'Gastly',
  'ゴースト': 'Haunter',
  'ゲンガー': 'Gengar',
  'イワーク': 'Onix',
  'スリープ': 'Drowzee',
  'スリーパー': 'Hypno',
  'クラブ': 'Krabby',
  'キングラー': 'Kingler',
  'ビリリダマ': 'Voltorb',
  'マルマイン': 'Electrode',
  'タマタマ': 'Exeggcute',
  'ナッシー': 'Exeggutor',
  'カラカラ': 'Cubone',
  'ガラガラ': 'Marowak',
  'サワムラー': 'Hitmonlee',
  'エビワラー': 'Hitmonchan',
  'ベロリンガ': 'Lickitung',
  'ドガース': 'Koffing',
  'マタドガス': 'Weezing',
  'サイホーン': 'Rhyhorn',
  'サイドン': 'Rhydon',
  'ラッキー': 'Chansey',
  'モンジャラ': 'Tangela',
  'ガルーラ': 'Kangaskhan',
  'ヒトデマン': 'Staryu',
  'スターミー': 'Starmie',
  'バリヤード': 'Mr. Mime',
  'ストライク': 'Scyther',
  'ルージュラ': 'Jynx',
  'エレブー': 'Electabuzz',
  'ブーバー': 'Magmar',
  'カイロス': 'Pinsir',
  'ケンタロス': 'Tauros',
  'コイキング': 'Magikarp',
  'ギャラドス': 'Gyarados',
  'ラプラス': 'Lapras',
  'メタモン': 'Ditto',
  'イーブイ': 'Eevee',
  'シャワーズ': 'Vaporeon',
  'サンダース': 'Jolteon',
  'ブースター': 'Flareon',
  'ポリゴン': 'Porygon',
  'オムナイト': 'Omanyte',
  'オムスター': 'Omastar',
  'カブト': 'Kabuto',
  'カブトプス': 'Kabutops',
  'プテラ': 'Aerodactyl',
  'カビゴン': 'Snorlax',
  'フリーザー': 'Articuno',
  'サンダー': 'Zapdos',
  'ファイヤー': 'Moltres',
  'ミニリュウ': 'Dratini',
  'ハクリュー': 'Dragonair',
  'カイリュー': 'Dragonite',
  'ミュウツー': 'Mewtwo',
  'ミュウ': 'Mew',
  // Gen 2 - Johto (popular)
  'チコリータ': 'Chikorita',
  'ベイリーフ': 'Bayleef',
  'メガニウム': 'Meganium',
  'ヒノアラシ': 'Cyndaquil',
  'マグマラシ': 'Quilava',
  'バクフーン': 'Typhlosion',
  'ワニノコ': 'Totodile',
  'アリゲイツ': 'Croconaw',
  'オーダイル': 'Feraligatr',
  'オタチ': 'Sentret',
  'ホーホー': 'Hoothoot',
  'ヨルノズク': 'Noctowl',
  'レディバ': 'Ledyba',
  'レディアン': 'Ledian',
  'イトマル': 'Spinarak',
  'アリアドス': 'Ariados',
  'ウソッキー': 'Sudowoodo',
  'エーフィ': 'Espeon',
  'ブラッキー': 'Umbreon',
  'ヤミラミ': 'Sableye',
  // Gen 3 - Hoenn (popular)
  'キモリ': 'Treecko',
  'ジュプトル': 'Grovyle',
  'ジュカイン': 'Sceptile',
  'アチャモ': 'Torchic',
  'ワカシャモ': 'Combusken',
  'バシャーモ': 'Blaziken',
  'ミズゴロウ': 'Mudkip',
  'ヌマクロー': 'Marshtomp',
  'ラグラージ': 'Swampert',
  'ラティオス': 'Latios',
  'ラティアス': 'Latias',
  'カイオーガ': 'Kyogre',
  'グラードン': 'Groudon',
  'レックウザ': 'Rayquaza',
  // Gen 4 - Sinnoh (popular)
  'ナエトル': 'Turtwig',
  'ハヤシガメ': 'Grotle',
  'ドダイトス': 'Torterra',
  'ヒコザル': 'Chimchar',
  'モウカザル': 'Monferno',
  'ゴウカザル': 'Infernape',
  'ポッチャマ': 'Piplup',
  'ポッタイシ': 'Prinplup',
  'エンペルト': 'Empoleon',
  'リオル': 'Riolu',
  'ルカリオ': 'Lucario',
  'ガブリアス': 'Garchomp',
  'ダークライ': 'Darkrai',
  'アルセウス': 'Arceus',
  'シェイミ': 'Shaymin',
  // Gen 5 - Unova (popular)
  'ツタージャ': 'Snivy',
  'ジャノビー': 'Servine',
  'ジャローダ': 'Serperior',
  'ポカブ': 'Tepig',
  'チャオブー': 'Pignite',
  'エンブオー': 'Emboar',
  'ミジュマル': 'Oshawott',
  'フタチマル': 'Dewott',
  'ダイケンキ': 'Samurott',
  'ゾロア': 'Zorua',
  'ゾロアーク': 'Zoroark',
  'ビクティニ': 'Victini',
  'レシラム': 'Reshiram',
  'ゼクロム': 'Zekrom',
  'キュレム': 'Kyurem',
  // Gen 6 - Kalos (popular)
  'ハリマロン': 'Chespin',
  'ハリボーグ': 'Quilladin',
  'ブリガロン': 'Chesnaught',
  'フォッコ': 'Fennekin',
  'テールナー': 'Braixen',
  'マフォクシー': 'Delphox',
  'ケロマツ': 'Froakie',
  'ゲコガシラ': 'Frogadier',
  'ゲッコウガ': 'Greninja',
  'ゼルネアス': 'Xerneas',
  'イベルタル': 'Yveltal',
  'ジガルデ': 'Zygarde',
  // Gen 7 - Alola (popular)
  'モクロー': 'Rowlet',
  'フクスロー': 'Dartrix',
  'ジュナイパー': 'Decidueye',
  'ニャビー': 'Litten',
  'ニャヒート': 'Torracat',
  'ガオガエン': 'Incineroar',
  'アシマリ': 'Popplio',
  'オシャマリ': 'Brionne',
  'アシレーヌ': 'Primarina',
  'ソルガレオ': 'Solgaleo',
  'ルナアーラ': 'Lunala',
  'ネクロズマ': 'Necrozma',
  'マギアナ': 'Magearna',
  'マーシャドウ': 'Marshadow',
  // Gen 8 - Galar (popular)
  'サルノリ': 'Grookey',
  'バチンキー': 'Thwackey',
  'ゴリランダー': 'Rillaboom',
  'ヒバニー': 'Scorbunny',
  'ラビフット': 'Raboot',
  'エースバーン': 'Cinderace',
  'メッソン': 'Sobble',
  'ジメレオン': 'Drizzile',
  'インテレオン': 'Inteleon',
  'ザシアン': 'Zacian',
  'ザマゼンタ': 'Zamazenta',
  'ムゲンダイナ': 'Eternatus',
  'バドレックス': 'Calyrex',
  // Gen 9 - Paldea (popular)
  'ニャオハ': 'Sprigatito',
  'ニャローテ': 'Floragato',
  'マスカーニャ': 'Meowscarada',
  'ホゲータ': 'Fuecoco',
  'アチゲータ': 'Crocalor',
  'ラウドボーン': 'Skeledirge',
  'クワッス': 'Quaxly',
  'ウェルカモ': 'Quaxwell',
  'ウェーニバル': 'Quaquaval',
  'コライドン': 'Koraidon',
  'ミライドン': 'Miraidon',
  'テツノツツミ': 'Iron Bundle',
  'テツノカイナ': 'Iron Hands',
  'テツノドクガ': 'Iron Moth',
  'テツノツチノコ': 'Iron Treads',
  'テツノワダチ': 'Iron Jugulis',
  'ハバタクカミ': 'Flutter Mane',
  'チオンジェン': 'Chien-Pao',
  'パオジアン': 'Chien-Pao',
  'ディンルー': 'Ting-Lu',
  'イーユイ': 'Chi-Yu',
  // Trainer cards and special
  'エネルギー': 'Energy',
  'ポケモン': 'Pokemon',
  'トレーナー': 'Trainer',
  'グッズ': 'Item',
  'サポート': 'Supporter',
  'スタジアム': 'Stadium',
  'ポケモンのどうぐ': 'Pokemon Tool',
}

/**
 * Look up English name from Japanese name using static map first,
 * then fall back to PokeAPI for names not in the map.
 */
export function lookupENName(jpName: string): string | null {
  // Clean suffixes and prefixes
  let clean = jpName
    .replace(/\s*(EX|ex|V|VMAX|VSTAR|GX|V-UNION|V-STAR|BREAK|Mega|★)$/i, '')
    .replace(/（[^）]*）/g, '') // Remove parenthetical text like （デルタ種）
    .replace(/\([^)]*\)/g, '') // Also remove English parens
    .trim()

  // Direct lookup
  if (JP_TO_EN[clean]) return JP_TO_EN[clean]

  // If the name contains English characters, try extracting just the EN part
  // e.g. "mewtwo" from "mewtwo（デルタ種）" or "Mewtwo" from "RocketのMewtwo Ex"
  const enMatch = clean.match(/[A-Za-z][a-z]+/)
  if (enMatch) {
    const enName = enMatch[0].charAt(0).toUpperCase() + enMatch[0].slice(1).toLowerCase()
    // Check if this English name exists in our values (reverse lookup)
    for (const [jp, en] of Object.entries(JP_TO_EN)) {
      if (en === enName) return enName
    }
  }

  // Try extracting Pokemon name from JP prefixes:
  // Pattern 1: text before の → remove prefix (ロケットのミュウツー, RocketのMewtwo)
  const noPrefix = clean.replace(/^[^\s]*の/, '').trim()
  if (noPrefix !== clean) {
    if (JP_TO_EN[noPrefix]) return JP_TO_EN[noPrefix]
    // After removing の prefix, also try EN match
    const enAfterNo = noPrefix.match(/[A-Za-z][a-z]+/)
    if (enAfterNo) {
      const enName2 = enAfterNo[0].charAt(0).toUpperCase() + enAfterNo[0].slice(1).toLowerCase()
      for (const [jp, en] of Object.entries(JP_TO_EN)) {
        if (en === enName2) return enName2
      }
    }
  }

  // Pattern 2: try removing common JP adjective prefixes (輝く, 光る, etc.)
  const jpAdjectives = /^(輝く|光る|闇の|古の|浮遊の|眠れる|怒りの|怒れる|踊る|走る|飛ぶ|泳ぐ|燃える|凍る|咲く|潜伏の|はねる|まもる|つきとばす|古来の|秘めたる|目覚めし|まぎれた|まもれる|よみがえる)\s*/
  const stripped = clean.replace(jpAdjectives, '').trim()
  if (stripped !== clean && JP_TO_EN[stripped]) return JP_TO_EN[stripped]

  // Pattern 3: try matching last 2+ JP characters against map keys
  // (handles prefixes we don't know about)
  for (let len = clean.length; len >= 2; len--) {
    const substr = clean.slice(-len)
    if (JP_TO_EN[substr]) return JP_TO_EN[substr]
  }

  // Try splitting by space and checking each word
  const words = clean.split(/\s+/)
  for (const word of words) {
    if (JP_TO_EN[word]) return JP_TO_EN[word]
  }

  return null
}