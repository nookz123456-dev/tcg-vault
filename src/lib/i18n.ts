// Thai/English UI translations for TCG Vault
// Card data stays in its original language (EN/JP)

const translations = {
  // Nav
  'nav.home': { th: 'หน้าแรก', en: 'Home' },
  'nav.search': { th: 'ค้นหา', en: 'Search' },
  'nav.sets': { th: 'เซ็ตการ์ด', en: 'Sets' },
  'nav.sealed': { th: 'ซีลผลิตภัณฑ์', en: 'Sealed' },
  'nav.discuss': { th: 'พูดคุย', en: 'Discuss' },
  'nav.community': { th: 'ชุมชน', en: 'Community' },
  'nav.collection': { th: 'คอลเลกชัน', en: 'Collection' },
  'nav.signIn': { th: 'เข้าสู่ระบบ', en: 'Sign In' },
  'nav.signOut': { th: 'ออกจากระบบ', en: 'Sign Out' },

  // Homepage
  'home.hero.title': { th: 'ติดตามราคาการ์ด TCG ทุกเซ็ต', en: 'Track TCG card prices across every set' },
  'home.hero.subtitle': { th: 'ฐานข้อมูลการ์ดโปเกม่อน One Piece ครบทุกภาษา พร้อมราคาอัปเดต', en: 'Complete Pokemon & One Piece card database with live pricing' },
  'home.hero.cta': { th: 'เริ่มค้นหา', en: 'Start Searching' },
  'home.hero.cta2': { th: 'ดูเซ็ตการ์ด', en: 'Browse Sets' },
  'home.stats.cards': { th: 'การ์ดในระบบ', en: 'Cards in Database' },
  'home.stats.sets': { th: 'เซ็ตการ์ด', en: 'Card Sets' },
  'home.stats.prices': { th: 'ราคาอัปเดต', en: 'Price Updates' },
  'home.features.title': { th: 'ฟีเจอร์หลัก', en: 'Key Features' },
  'home.features.search': { th: 'ค้นหาการ์ด', en: 'Card Search' },
  'home.features.searchDesc': { th: 'ค้นหาจากชื่อ ประเภท ความหายาก รองรับทั้ง EN และ JP', en: 'Search by name, type, rarity. Supports EN and JP' },
  'home.features.prices': { th: 'ราคาแบบเรียลไทม์', en: 'Live Pricing' },
  'home.features.pricesDesc': { th: 'ราคาจาก TCGplayer, CardMarket พร้อมแปลงสกุลเงิน THB', en: 'TCGplayer & CardMarket prices with THB conversion' },
  'home.features.graded': { th: 'ราคาจัดเกรด', en: 'Graded Prices' },
  'home.features.gradedDesc': { th: 'ราคา PSA, CGC, BGS สำหรับการ์ดจัดเกรด', en: 'PSA, CGC, BGS pricing for graded cards' },
  'home.features.collection': { th: 'จัดการคอลเลกชัน', en: 'Collection Management' },
  'home.features.collectionDesc': { th: 'เก็บการ์ดของคุณ ติดตามมูลค่า แชร์ให้เพื่อนดู', en: 'Track your cards, monitor value, share with friends' },
  'home.features.community': { th: 'ชุมชนนักสะสม', en: 'Collector Community' },
  'home.features.communityDesc': { th: 'พูดคุย แลกเปลี่ยน ตามนักสะสมคนอื่น', en: 'Discuss, trade, and follow other collectors' },
  'home.features.sealed': { th: 'ซีลผลิตภัณฑ์', en: 'Sealed Products' },
  'home.features.sealedDesc': { th: 'ราคากล่อง Booster, ETB, Blister Pack อัปเดต', en: 'Booster Box, ETB, Blister Pack pricing updated live' },
  'home.how.title': { th: 'ใช้งานง่าย 3 ขั้นตอน', en: 'Get Started in 3 Steps' },
  'home.how.step1': { th: '1. ค้นหาการ์ด', en: '1. Search for a Card' },
  'home.how.step1Desc': { th: 'พิมพ์ชื่อการ์ด ภาษาอังกฤษหรือญี่ปุ่นก็ได้', en: 'Type any card name in English or Japanese' },
  'home.how.step2': { th: '2. ดูราคาเต็มๆ', en: '2. Check Prices' },
  'home.how.step2Desc': { th: 'ราคาตามสภาพ ราคาจัดเกรด กราฟราคาย้อนหลัง', en: 'Condition prices, graded prices, price history charts' },
  'home.how.step3': { th: '3. เพิ่มเข้าคอลเลกชัน', en: '3. Add to Collection' },
  'home.how.step3Desc': { th: 'เก็บการ์ดที่สนใจ ติดตามมูลค่ารวมอัตโนมัติ', en: 'Save cards you love, track total value automatically' },
  'home.community.title': { th: 'เข้าร่วมชุมชนนักสะสม', en: 'Join the Collector Community' },
  'home.community.desc': { th: 'พูดคุยเรื่องการ์ด แลกเปลี่ยน ตามกระแสตลาด ร่วมกับนักสะสมคนอื่น', en: 'Discuss cards, trade with others, follow market trends' },
  'home.community.cta': { th: 'เข้าชุมชน', en: 'Join Community' },
  'home.footer.desc': { th: 'ฐานข้อมูลการ์ด TCG ที่ครบที่สุด สำหรับนักสะสมไทย', en: 'The most complete TCG card database for Thai collectors' },

  // Sets page
  'sets.title': { th: 'เซ็ตการ์ด', en: 'Card Sets' },
  'sets.subtitle': { th: 'เรียกดูทุกเซ็ต — ทุกการ์ดบนโลก', en: 'Browse all sets — every card in existence' },
  'sets.search': { th: 'ค้นหาเซ็ต...', en: 'Search sets...' },
  'sets.cards': { th: 'การ์ด', en: 'cards' },
  'sets.sets': { th: 'เซ็ต', en: 'sets' },
  'sets.in': { th: 'ใน', en: 'in' },
  'sets.noSets': { th: 'ไม่พบเซ็ต', en: 'No sets found' },
  'sets.tryDifferent': { th: 'ลองค้นหาด้วยคำอื่น', en: 'Try a different search' },
  'sets.loading': { th: 'กำลังโหลดเซ็ต...', en: 'Loading sets...' },

  // Set detail
  'set.released': { th: 'วางจำหน่าย', en: 'Released' },
  'set.allRarities': { th: 'ทุกความหายาก', en: 'All Rarities' },
  'set.allTypes': { th: 'ทุกประเภท', en: 'All Types' },
  'set.showing': { th: 'แสดง', en: 'Showing' },
  'set.of': { th: 'จาก', en: 'of' },
  'set.loadMore': { th: 'โหลดเพิ่ม', en: 'Load More' },
  'set.remaining': { th: 'ยังเหลือ', en: 'remaining' },

  // Search
  'search.placeholder': { th: 'ค้นหาการ์ด... ชื่ออังกฤษหรือญี่ปุ่น', en: 'Search cards... English or Japanese' },
  'search.noResults': { th: 'ไม่พบการ์ด', en: 'No cards found' },
  'search.tryDifferent': { th: 'ลองค้นหาด้วยคำอื่น', en: 'Try a different search' },
  'search.added': { th: 'เพิ่มแล้ว', en: 'Added' },
  'search.addToCollection': { th: 'เพิ่มในคอลเลกชัน', en: 'Add to Collection' },
  'search.viewDetails': { th: 'ดูรายละเอียด', en: 'View Full Details' },
  'search.allGames': { th: 'ทั้งหมด', en: 'All Games' },
  'search.filter': { th: 'ตัวกรอง', en: 'Filter' },
  'search.results': { th: 'ผลลัพธ์', en: 'results' },

  // Card detail
  'card.priceGuide': { th: 'ราคาตามสภาพ', en: 'Price Guide' },
  'card.condition': { th: 'สภาพ', en: 'Condition' },
  'card.graded': { th: 'ราคาจัดเกรด', en: 'Graded Prices' },
  'card.priceHistory': { th: 'กราฟราคา', en: 'Price History' },
  'card.cardDetails': { th: 'รายละเอียดการ์ด', en: 'Card Details' },
  'card.weakness': { th: 'จุดอ่อน', en: 'Weakness' },
  'card.resistance': { th: 'ความต้านทาน', en: 'Resistance' },
  'card.retreat': { th: 'ล่าถอย', en: 'Retreat Cost' },
  'card.set': { th: 'เซ็ต', en: 'Set' },
  'card.number': { th: 'หมายเลข', en: 'Number' },
  'card.rarity': { th: 'ความหายาก', en: 'Rarity' },
  'card.illustrator': { th: 'ผู้วาด', en: 'Illustrator' },
  'card.regulation': { th: 'เครื่องหมายกฎ', en: 'Regulation Mark' },
  'card.trend': { th: 'แนวโน้มราคา', en: 'Price Trend' },
  'card.wishlist': { th: 'เพิ่มในวิชลิสต์', en: 'Add to Wishlist' },
  'card.inWishlist': { th: 'อยู่ในวิชลิสต์', en: 'In Wishlist' },
  'card.discussion': { th: 'พูดคุยเกี่ยวกับการ์ดใบนี้', en: 'Community Discussion' },
  'card.signInToComment': { th: 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น', en: 'Sign in to comment' },
  'card.writeComment': { th: 'เขียนความคิดเห็น...', en: 'Write a comment...' },
  'card.post': { th: 'ส่ง', en: 'Post' },
  'card.comments': { th: 'ความคิดเห็น', en: 'comments' },

  // Collection
  'collection.title': { th: 'คอลเลกชันของฉัน', en: 'My Collection' },
  'collection.empty': { th: 'ยังไม่มีการ์ดในคอลเลกชัน', en: 'No cards in collection yet' },
  'collection.addCards': { th: 'เพิ่มการ์ดเลย!', en: 'Add some cards!' },
  'collection.totalValue': { th: 'มูลค่ารวม', en: 'Total Value' },
  'collection.totalCards': { th: 'การ์ดทั้งหมด', en: 'Total Cards' },
  'collection.makePublic': { th: 'ทำเป็นสาธารณะ', en: 'Make Public' },
  'collection.viewProfile': { th: 'ดูโปรไฟล์', en: 'View Profile' },
  'collection.remove': { th: 'ลบ', en: 'Remove' },

  // Sealed
  'sealed.title': { th: 'ซีลผลิตภัณฑ์', en: 'Sealed Products' },
  'sealed.subtitle': { th: 'ราคาผลิตภัณฑ์ที่ยังไม่แกะ', en: 'Unopened product pricing' },
  'sealed.latestSets': { th: 'เซ็ตล่าสุด', en: 'Latest Sets' },
  'sealed.viewOnTCGplayer': { th: 'ดูบน TCGplayer', en: 'View on TCGplayer' },

  // Community
  'community.title': { th: 'ชุมชน', en: 'Community' },
  'community.activity': { th: 'กิจกรรมล่าสุด', en: 'Activity Feed' },
  'community.leaderboard': { th: 'อันดับนักสะสม', en: 'Leaderboard' },
  'community.trending': { th: 'การ์ดยอดนิยม', en: 'Trending Cards' },

  // Login
  'login.title': { th: 'เข้าสู่ระบบ', en: 'Sign In' },
  'login.subtitle': { th: 'เข้าสู่ระบบเพื่อจัดการคอลเลกชัน', en: 'Sign in to manage your collection' },
  'login.email': { th: 'อีเมล', en: 'Email' },
  'login.password': { th: 'รหัสผ่าน', en: 'Password' },
  'login.signIn': { th: 'เข้าสู่ระบบ', en: 'Sign In' },
  'login.signUp': { th: 'สมัครสมาชิก', en: 'Sign Up' },
  'login.or': { th: 'หรือ', en: 'or' },
  'login.noAccount': { th: 'ยังไม่มีบัญชี?', en: "Don't have an account?" },
  'login.hasAccount': { th: 'มีบัญชีอยู่แล้ว?', en: 'Already have an account?' },
  'login.guest': { th: 'ใช้แบบไม่เข้าระบบ', en: 'Continue as Guest' },

  // Discussions
  'discuss.title': { th: 'กระดานสนทนา', en: 'Discussion Boards' },
  'discuss.subtitle': { th: 'พูดคุยกับนักสะสมคนอื่น', en: 'Chat with fellow collectors' },
  'discuss.allThreads': { th: 'ทุกกระทู้', en: 'All Threads' },
  'discuss.newThread': { th: '+ ตั้งกระทู้ใหม่', en: '+ New Thread' },
  'discuss.noThreads': { th: 'ยังไม่มีกระทู้', en: 'No threads yet' },
  'discuss.startConv': { th: 'เริ่มการสนทนา — ตั้งกระทู้แรก!', en: 'Start the conversation — create the first thread!' },
  'discuss.signInToPost': { th: 'เข้าสู่ระบบเพื่อตั้งกระทู้', en: 'Sign in to start a discussion' },

  // Trades
  'trades.title': { th: 'ศูนย์แลกเปลี่ยน', en: 'Trade Center' },
  'trades.subtitle': { th: 'จัดการข้อเสนอแลกเปลี่ยน', en: 'Manage your trade offers' },
  'trades.noTrades': { th: 'ยังไม่มีข้อเสนอแลกเปลี่ยน', en: 'No trades yet' },
  'trades.noTradesDesc': { th: 'เมื่อคุณส่งหรือรับข้อเสนอแลกเปลี่ยน จะแสดงที่นี่', en: 'When you send or receive trade offers, they will appear here' },
  'trades.offered': { th: 'เสนอ', en: 'Offered' },
  'trades.requested': { th: 'ขอแลก', en: 'Requested' },
  'trades.accept': { th: 'ยอมรับ', en: 'Accept' },
  'trades.reject': { th: 'ปฏิเสธ', en: 'Reject' },
  'trades.cancelOffer': { th: 'ยกเลิกข้อเสนอ', en: 'Cancel Offer' },
  'trades.markCompleted': { th: 'ทำเครื่องหมายว่าเสร็จสมบูรณ์', en: 'Mark Completed' },
  'trades.signIn': { th: 'เข้าสู่ระบบเพื่อใช้งานแลกเปลี่ยน', en: 'Sign in to access trades' },

  // Notifications
  'notif.title': { th: 'การแจ้งเตือน', en: 'Notifications' },
  'notif.unread': { th: 'ยังไม่อ่าน', en: 'unread' },
  'notif.markAllRead': { th: 'อ่านทั้งหมดแล้ว', en: 'Mark all read' },
  'notif.none': { th: 'ยังไม่มีการแจ้งเตือน', en: 'No notifications yet' },
  'notif.noneDesc': { th: 'เมื่อมีคนติดตาม ตอบกลับ หรือส่งข้อเสนอแลกเปลี่ยน จะแจ้งที่นี่', en: 'When someone follows you, replies, or sends a trade offer, you will see it here' },
  'notif.signIn': { th: 'เข้าสู่ระบบเพื่อดูการแจ้งเตือน', en: 'Sign in to see notifications' },

  // Badges
  'badges.title': { th: 'เหรียญตรา', en: 'Badges' },
  'badges.subtitle': { th: 'สะสมเหรียญตราจากการสะสม แลกเปลี่ยน และมีส่วนร่วม', en: 'Earn badges by collecting, trading, and participating in the community' },
  'badges.unlock': { th: 'บรรลุเพื่อปลดล็อก', en: 'Reach to unlock' },

  // Community extras
  'community.noActivity': { th: 'ยังไม่มีกิจกรรม', en: 'No activity yet' },
  'community.noActivityDesc': { th: 'เป็นคนแรก! เริ่มเพิ่มการ์ดเข้าคอลเลกชัน', en: 'Be the first! Start adding cards to your collection.' },
  'community.noLeaders': { th: 'ยังไม่มีนักสะสมบนกระดาน', en: 'No collectors on the board yet' },
  'community.noLeadersDesc': { th: 'ตั้งค่าคอลเลกชันเป็นสาธารณะเพื่อขึ้นอันดับ!', en: 'Make your collection public to appear on the leaderboard!' },
  'community.noTrending': { th: 'ยังไม่มีการ์ดยอดนิยม', en: 'No trending cards yet' },
  'community.noTrendingDesc': { th: 'เริ่มเพิ่มการ์ดเพื่อดูว่าอะไรกำลังฮิต!', en: 'Start adding cards to see what\'s popular!' },
  'community.joinCta': { th: 'เข้าร่วมชุมชน', en: 'Join the Community' },
  'community.joinDesc': { th: 'สร้างบัญชีเพื่อเพิ่มการ์ด แสดงความคิดเห็น และขึ้นอันดับ', en: 'Create an account to add cards, comment, and see your collection on the leaderboard.' },
  'community.getStarted': { th: 'เริ่มต้นใช้งาน', en: 'Get Started' },
  'community.discussCta': { th: 'พูดคุยเรื่องการ์ด', en: 'Discussion Boards' },
  'community.discussDesc': { th: 'พูดคุยกับนักสะสมคนอื่น', en: 'Chat with fellow collectors' },
  'community.tradeCta': { th: 'แลกเปลี่ยนการ์ด', en: 'Trade Center' },
  'community.tradeDesc': { th: 'หาคนแลกเปลี่ยน', en: 'Find trade partners' },
  'community.badgeCta': { th: 'เหรียญตรา', en: 'Badges' },
  'community.badgeDesc': { th: 'สะสมความสำเร็จ', en: 'Earn achievements' },

  // Discussions
  'discuss.pinned': { th: 'ปักหมุด', en: 'Pinned' },
  'discuss.postThread': { th: 'ตั้งกระทู้', en: 'Post Thread' },
  'discuss.posting': { th: 'กำลังตั้งกระทู้...', en: 'Posting...' },
  'discuss.replies': { th: 'คำตอบ', en: 'replies' },
  'discuss.threadTitle': { th: 'หัวข้อกระทู้...', en: 'Thread title...' },
  'discuss.threadContent': { th: 'แชร์ความคิดเห็นของคุณ...', en: 'Share your thoughts...' },
  'discuss.selectBoard': { th: 'เลือกบอร์ด', en: 'Select Board' },
  'discuss.selectBoardHint': { th: 'กรุณาเลือกบอร์ดก่อนตั้งกระทู้', en: 'Please select a board before posting' },

  // Profile
  'profile.followers': { th: 'ผู้ติดตาม', en: 'Followers' },
  'profile.following': { th: 'กำลังติดตาม', en: 'Following' },
  'profile.follow': { th: 'ติดตาม', en: 'Follow' },
  'profile.unfollow': { th: 'เลิกติดตาม', en: 'Following' },
  'profile.notFound': { th: 'ไม่พบผู้ใช้', en: 'User not found' },
  'profile.comingSoon': { th: 'เร็วๆ นี้', en: 'Coming soon' },

  // Common
  'common.loading': { th: 'กำลังโหลด...', en: 'Loading...' },
  'common.noImage': { th: 'ไม่มีรูป', en: 'No image' },
  'common.back': { th: 'กลับ', en: 'Back' },
  'common.save': { th: 'บันทึก', en: 'Save' },
  'common.cancel': { th: 'ยกเลิก', en: 'Cancel' },
  'common.delete': { th: 'ลบ', en: 'Delete' },
  'common.edit': { th: 'แก้ไข', en: 'Edit' },
  'common.search': { th: 'ค้นหา', en: 'Search' },
  'common.cards': { th: 'การ์ด', en: 'cards' },
  'common.sets': { th: 'เซ็ต', en: 'sets' },
  'common.signIn': { th: 'เข้าสู่ระบบ', en: 'Sign In' },
  'common.signOut': { th: 'ออกจากระบบ', en: 'Sign Out' },
  'common.guestMode': { th: 'โหมดผู้เยี่ยมชม', en: 'Guest Mode' },
  'common.searchCards': { th: 'ค้นหาการ์ด →', en: 'Search Cards →' },
  'common.ago': { th: 'ที่แล้ว', en: 'ago' },
  'common.from': { th: 'จาก', en: 'from' },
  'common.to': { th: 'ถึง', en: 'to' },
} as const

export type Locale = 'th' | 'en'
export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] || translations[key]?.['en'] || key
}

// Simple context without JSX (JSX is in ClientLayout.tsx)
import { createContext, useContext } from 'react'

export const LocaleContext = createContext<Locale>('th')

export function useLocale() {
  const locale = useContext(LocaleContext)
  const setLocale = (newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tcg-vault-locale', newLocale)
      window.location.reload()
    }
  }
  return { locale, setLocale }
}

export function useT() {
  const locale = useContext(LocaleContext)
  return (key: TranslationKey) => t(key, locale)
}