const fs = require('fs');
const path = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/collection/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Add i18n import
c = c.replace(
  "import Link from 'next/link'",
  "import Link from 'next/link'\nimport { useT } from '@/lib/i18n'"
);

// Add useT() hook in component
c = c.replace(
  'const { cards, isLoaded, removeCard, updateCard, totalValue, totalInvested, totalCards } = useLocalCollection()',
  'const { cards, isLoaded, removeCard, updateCard, totalValue, totalInvested, totalCards } = useLocalCollection()\n const t = useT()'
);

// Replace all hardcoded English strings with t() calls
c = c.replace('>Loading...</div>', '>{t(\'common.loading\') || \'Loading...\'}</div>');
c = c.replace('>My Collection</h1>', '>{t(\'collection.title\') || \'My Collection\'}</h1>');
c = c.replace('>View Profile →</a>', '>{t(\'collection.viewProfile\') || \'View Profile →\'}</a>');
c = c.replace('>Guest Mode</span>', '>{t(\'collection.guestMode\') || \'Guest Mode\'}</span>');
c = c.replace(/>\s*Make Public\s*<\/button>/, '>{t(\'collection.makePublic\') || \'Make Public\'}</button>');
c = c.replace('\'Data saved locally on this device. Sign in to sync across devices.\' : \'Track and manage your card portfolio\'', 't(\'collection.guestDesc\') || \'Data saved locally. Sign in to sync.\' : t(\'collection.userDesc\') || \'Track and manage your card portfolio\'');
c = c.replace('>Total Cards</p>', '>{t(\'collection.totalCards\') || \'Total Cards\'}</p>');
c = c.replace('>Collection Value</p>', '>{t(\'collection.value\') || \'Collection Value\'}</p>');
c = c.replace('>Total Invested</p>', '>{t(\'collection.invested\') || \'Total Invested\'}</p>');
c = c.replace('>Profit/Loss</p>', '>{t(\'collection.profitLoss\') || \'Profit/Loss\'}</p>');
c = c.replace('>Your collection is empty</p>', '>{t(\'collection.empty\') || \'Your collection is empty\'}</p>');
c = c.replace('>Start by searching for cards and adding them</p>', '>{t(\'collection.emptyDesc\') || \'Start by searching for cards\'}</p>');
c = c.replace(/>Search Cards →</, '>{t(\'collection.searchCards\') || \'Search Cards →\'}</');
c = c.replace('>Condition</p>', '>{t(\'collection.condition\') || \'Condition\'}</p>');
c = c.replace('>Market</p>', '>{t(\'collection.market\') || \'Market\'}</p>');
c = c.replace('>Paid</p>', '>{t(\'collection.paid\') || \'Paid\'}</p>');
c = c.replace('>Total</p>', '>{t(\'collection.total\') || \'Total\'}</p>');
c = c.replace(/>\\+ Add More Cards</, '>{t(\'collection.addMore\') || \'+ Add More Cards\'}</');

// Replace confirm dialog
c = c.replace("'Remove this card?'", "t('collection.removeConfirm') || 'Remove this card?'");

fs.writeFileSync(path, c, 'utf8');
console.log('Updated collection/page.tsx with i18n');