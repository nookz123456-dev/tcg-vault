// Centralized Thai/English strings for card detail pages
// Avoids fragile find-replace on individual page files
import { useT, useLocale } from './i18n'

export function useCardStrings() {
  const t = useT()
  const { locale } = useLocale()
  
  return {
    locale,
    // Labels
    priceByCondition: t('card.priceByCondition'),
    tcgplayerPrices: t('card.tcgplayerPrices'),
    graded: t('card.graded'),
    psaDesc: t('card.psaDesc'),
    cardmarket: t('card.cardmarket'),
    cardmarketDesc: t('card.cardmarketDesc'),
    trendPrice: t('card.trendPrice'),
    avgSell: t('card.avgSell'),
    lowPrice: t('card.lowPrice'),
    day7Avg: t('card.7dayAvg'),
    day30Avg: t('card.30dayAvg'),
    viewOnTCGplayer: t('card.viewOnTCGplayer'),
    viewOnCardMarket: t('card.viewOnCardMarket'),
    noPriceData: t('card.noPriceData'),
    noPriceDesc: t('card.noPriceDesc'),
    cardDetails: t('card.cardDetails'),
    condition: t('card.condition'),
    market: t('card.market'),
    low: t('card.low'),
    mid: t('card.mid'),
    high: t('card.high'),
    grade: locale === 'th' ? 'เกรด' : 'Grade',
    series: t('card.series'),
    released: t('card.released'),
    pokedex: t('card.pokedex'),
    subtypes: t('card.subtypes'),
    abilities: t('card.abilities'),
    attacks: t('card.attacks'),
    weakness: t('card.weakness'),
    resistance: t('card.resistance'),
    retreat: t('card.retreat'),
    illustratedBy: t('card.illustratedBy'),
    setPriceAlert: t('card.setPriceAlert'),
    addWishlist: t('card.addWishlist'),
    inWishlist: t('card.inWishlist'),
    communityDiscussion: t('card.communityDiscussion'),
    signInToComment: t('card.signInToComment'),
    shareYourThoughts: t('card.shareYourThoughts'),
    postComment: t('card.postComment'),
    noComments: t('card.noComments'),
    cardNotFound: t('card.cardNotFound'),
    goBack: t('card.goBack'),
    backToSearch: t('card.backToSearch'),
    // Conditions
    nearMint: t('condition.nearMint'),
    lightlyPlayed: t('condition.lightlyPlayed'),
    moderatelyPlayed: t('condition.moderatelyPlayed'),
    heavilyPlayed: t('condition.heavilyPlayed'),
    damaged: t('condition.damaged'),
    // One Piece specific
    effect: t('card.effect'),
    ability: t('card.ability'),
    cardStats: t('card.cardStats'),
    life: t('card.life'),
    counter: t('card.counter'),
    type: t('card.type'),
    attribute: t('card.attribute'),
    color: t('card.color'),
    cost: t('card.cost'),
    power: t('card.power'),
    // Common
    signIn: t('common.signIn'),
    loading: t('common.loading'),
    noImage: t('common.noImage'),
    // Format date with locale
    formatDate: (dateStr: string, opts?: Intl.DateTimeFormatOptions) => 
      new Date(dateStr).toLocaleDateString(
        locale === 'th' ? 'th-TH' : 'en-US', 
        opts || { year: 'numeric', month: 'short', day: 'numeric' }
      ),
  }
}