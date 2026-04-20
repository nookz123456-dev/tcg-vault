const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

function readFile(relPath) {
  return fs.readFileSync(path.join(cwd, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(cwd, relPath), content);
}

function replaceInFile(relPath, replacements) {
  let content = readFile(relPath);
  for (const [oldText, newText] of replacements) {
    if (!content.includes(oldText)) {
      console.error(`  NOT FOUND in ${relPath}: ${JSON.stringify(oldText.substring(0, 80))}`);
      continue;
    }
    content = content.replace(oldText, newText);
  }
  writeFile(relPath, content);
  console.log(`  ✅ ${relPath}`);
}

// ============ 1. discussions/page.tsx ============
replaceInFile('src/app/discussions/page.tsx', [
  [" const isThai = locale === 'th'\r\n", ''],
  ["label={isThai ? 'รูปภาพประกอบ' : 'Attach Image'}", "label={t('discuss.attachImage')}"],
]);

// ============ 2. badges/page.tsx ============
// Replace isThai detection with useLocale
let badges = readFile('src/app/badges/page.tsx');
// Remove old isThai detection
badges = badges.replace(" const isThai = t('common.ago') === 'ที่แล้ว'\r\n", '');
// Add useLocale import
badges = badges.replace("import { useT } from '@/lib/i18n'", "import { useT, useLocale } from '@/lib/i18n'");
// Add locale
badges = badges.replace(' const t = useT()\r\n', " const t = useT()\r\n const { locale } = useLocale()\r\n const isThai = locale === 'th'\r\n");
// Replace CATEGORY_LABELS usage with i18n
badges = badges.replace(
  "isThai ? CATEGORY_LABELS[category]?.th || category : CATEGORY_LABELS[category]?.en || category",
  "t(`badges.category.${category}`) || category"
);
// Replace threshold text
badges = badges.replace(
  "isThai ? `สะสม ${badge.threshold} เพื่อปลดล็อก` : `Reach ${badge.threshold} to unlock`",
  "t('badges.unlock')"
);
writeFile('src/app/badges/page.tsx', badges);
console.log('  ✅ src/app/badges/page.tsx');

// ============ 3. trades/page.tsx ============
let trades = readFile('src/app/trades/page.tsx');
// Remove old isThai detection
trades = trades.replace(" const isThai = t('common.ago') === 'ที่แล้ว'\r\n", '');
// Add useLocale import  
trades = trades.replace("import { useT } from '@/lib/i18n'", "import { useT, useLocale } from '@/lib/i18n'");
// Add locale + isThai (still needed for STATUS_LABELS)
trades = trades.replace(' const t = useT()\r\n', " const t = useT()\r\n const { locale } = useLocale()\r\n const isThai = locale === 'th'\r\n");

// Replace filter tab labels  
trades = trades.replace(
  "{STATUS_LABELS[f] ? (isThai ? STATUS_LABELS[f].th : STATUS_LABELS[f].en) : f.charAt(0).toUpperCase() + f.slice(1)}",
  "{t(`trades.status.${f}`) || (f.charAt(0).toUpperCase() + f.slice(1))}"
);
// Replace status labels in offer cards
trades = trades.replace(
  "{STATUS_LABELS[offer.status] ? (isThai ? STATUS_LABELS[offer.status].th : STATUS_LABELS[offer.status].en) : offer.status}",
  "{t(`trades.status.${offer.status}`) || offer.status}"
);
// Replace 'from' text
trades = trades.replace(
  "isThai ? 'จาก' : 'from'",
  "t('common.from')"
);
writeFile('src/app/trades/page.tsx', trades);
console.log('  ✅ src/app/trades/page.tsx');

// ============ 4. Navbar.tsx ============
let navbar = readFile('src/components/Navbar.tsx');
// Remove isThai declaration
navbar = navbar.replace("  const isThai = locale === 'th'\r\n", '');
// Replace 'More' text
navbar = navbar.replace(
  "                {isThai ? 'เพิ่มเติม' : 'More'}\r",
  "                {t('nav.more')}\r"
);
// Replace seller title attribute
navbar = navbar.replace(
  'title={isThai ? \'สมัครเป็นผู้ขาย\' : \'Seller\'}',
  "title={t('nav.sellerApply')}"
);
// Replace seller text in mobile menu
navbar = navbar.replace(
  "{isThai ? 'สมัครเป็นผู้ขาย' : 'Seller'}",
  "{t('nav.sellerApply')}"
);
// Replace profile text in mobile menu
navbar = navbar.replace(
  "{isThai ? 'โปรไฟล์' : 'Profile'}",
  "{t('nav.profile')}"
);
writeFile('src/components/Navbar.tsx', navbar);
console.log('  ✅ src/components/Navbar.tsx');

// ============ 5. TopMovers.tsx ============
let topMovers = readFile('src/components/TopMovers.tsx');
// Remove isThai declaration
topMovers = topMovers.replace("  const isThai = locale === 'th'\r\n", '');
// Replace title
topMovers = topMovers.replace(
  "isThai ? 'การ์ดเคลื่อนไหววันนี้' : 'Top Movers Today'",
  "t('movers.title')"
);
// Replace gainers short
topMovers = topMovers.replace(
  "isThai ? 'ขึ้น' : 'Gainers'",
  "t('movers.gainersShort')"
);
// Replace losers short
topMovers = topMovers.replace(
  "isThai ? 'ลง' : 'Losers'",
  "t('movers.losersShort')"
);
// Replace no data
topMovers = topMovers.replace(
  "isThai ? 'ยังไม่มีข้อมูล' : 'No data yet'",
  "t('movers.noData')"
);
// Replace view all
topMovers = topMovers.replace(
  "isThai ? 'ดูทั้งหมด →' : 'View All →'",
  "t('movers.viewAllArrow')"
);
writeFile('src/components/TopMovers.tsx', topMovers);
console.log('  ✅ src/components/TopMovers.tsx');

// ============ 6. alerts/page.tsx ============
let alerts = readFile('src/app/alerts/page.tsx');
// Remove isThai declaration
alerts = alerts.replace(" const isThai = locale === 'th'\r\n", '');
// Replace sign in required
alerts = alerts.replace(
  "isThai ? 'กรุณาเข้าสู่ระบบ' : 'Sign in required'",
  "t('alerts.signInRequired')"
);
// Replace sign in button
alerts = alerts.replace(
  "isThai ? 'เข้าสู่ระบบ' : 'Sign In'",
  "t('common.signIn')"
);
// Replace alerts title
alerts = alerts.replace(
  "isThai ? 'การแจ้งเตือนราคา' : 'Price Alerts'",
  "t('alerts.title')"
);
// Replace alerts description
alerts = alerts.replace(
  "isThai\r\n ? 'ตั้งค่าราคาเป้าหมาย เราจะแจ้งเมื่อราคาการ์ดถึงเป้าที่คุณตั้งไว้ (สูงสุด 20 รายการ)'\r\n : 'Set target prices and get notified when a card reaches your price. (Max 20 active alerts)'",
  "t('alerts.description')"
);
// Replace no alerts title
alerts = alerts.replace(
  "isThai ? 'ยังไม่มีการแจ้งเตือน' : 'No alerts yet'",
  "t('alerts.noAlerts')"
);
// Replace no alerts desc
alerts = alerts.replace(
  "isThai\r\n ? 'ไปที่หน้ารายละเอียดการ์ดแล้วกดปุ่ม 🔔 เพื่อตั้งราคาเป้าหมาย'\r\n : 'Visit a card detail page and click 🔔 to set a price alert'",
  "t('alerts.noAlertsDescFull')"
);
// Replace search cards button
alerts = alerts.replace(
  "isThai ? 'ค้นหาการ์ด' : 'Search Cards'",
  "t('alerts.searchCards')"
);
// Replace below/above
alerts = alerts.replace(
  "(isThai ? 'ต่ำกว่า' : 'Below')",
  "t('alerts.below')"
);
alerts = alerts.replace(
  "(isThai ? 'สูงกว่า' : 'Above')",
  "t('alerts.above')"
);
// Replace triggered
alerts = alerts.replace(
  "isThai ? 'ทริกเกอร์แล้ว' : 'Triggered'",
  "t('alerts.triggered')"
);
// Replace on/off
alerts = alerts.replace(
  "alert.is_active ? (isThai ? 'เปิด' : 'On') : (isThai ? 'ปิด' : 'Off')",
  "alert.is_active ? t('alerts.on') : t('alerts.off')"
);
// Replace add new alert
alerts = alerts.replace(
  "isThai ? 'เพิ่มการแจ้งเตือนใหม่' : 'Add new alert'",
  "t('alerts.addNewAlert')"
);
writeFile('src/app/alerts/page.tsx', alerts);
console.log('  ✅ src/app/alerts/page.tsx');

// ============ 7. discussions/[id]/page.tsx ============
let thread = readFile('src/app/discussions/[id]/page.tsx');
// Remove isThai declaration
thread = thread.replace("  const isThai = locale === 'th'\r\n", '');
// Replace timeAgo inline th/ago
thread = thread.replace(
  "isThai ? 'ที่แล้ว' : 'ago'",
  "t('common.ago')"
);
// Replace formatDate locale
thread = thread.replace(
  "isThai ? 'th-TH' : undefined",
  "locale === 'th' ? 'th-TH' : undefined"
);
// Add locale variable since we removed isThai
thread = thread.replace(
  "  const t = useT()\r\n  const { locale } = useLocale()\r\n",
  "  const t = useT()\r\n  const { locale } = useLocale()\r\n"
);
// Replace thread not found
thread = thread.replace(
  "isThai ? 'ไม่พบกระทู้' : 'Thread not found'",
  "t('discuss.threadNotFound')"
);
// Replace back to discussions
thread = thread.replace(
  "isThai ? 'กลับไปกระดานสนทนา' : 'Back to Discussions'",
  "t('discuss.backToDiscussions')"
);
// Replace discussions breadcrumb
thread = thread.replace(
  "isThai ? 'กระดานสนทนา' : 'Discussions'",
  "t('discuss.discussionsBreadcrumb')"
);
// Replace like text
thread = thread.replace(
  "isThai ? 'ถูกใจ' : 'Like'",
  "t('discuss.like')"
);
// Replace replies heading
thread = thread.replace(
  "isThai ? 'ความคิดเห็น' : 'Replies'",
  "t('discuss.repliesHeading')"
);
// Replace post reply title
thread = thread.replace(
  "isThai ? 'เขียนความคิดเห็น' : 'Post a Reply'",
  "t('discuss.postReply')"
);
// Replace reply placeholder
thread = thread.replace(
  "isThai ? 'เขียนความคิดเห็นของคุณ...' : 'Write your reply...'",
  "t('discuss.writeReplyPlaceholder')"
);
// Replace attach image
thread = thread.replace(
  "isThai ? 'แนบรูปภาพ' : 'Attach Image'",
  "t('discuss.attachImageShort')"
);
// Replace posting/sending
thread = thread.replace(
  "submitting ? (isThai ? 'กำลังส่ง...' : 'Posting...') : (isThai ? 'ส่งความคิดเห็น' : 'Reply')",
  "submitting ? t('discuss.postingShort') : t('discuss.sendReply')"
);
// Replace sign in to discuss
thread = thread.replace(
  "isThai ? 'เข้าสู่ระบบเพื่อร่วมสนทนา' : 'Sign in to join the discussion'",
  "t('discuss.signInToDiscuss')"
);
// Replace sign in button
thread = thread.replace(
  "isThai ? 'เข้าสู่ระบบ' : 'Sign In'",
  "t('common.signIn')"
);
// Replace thread locked
thread = thread.replace(
  "isThai ? 'กระทู้นี้ถูกล็อก' : 'This thread is locked'",
  "t('discuss.threadLocked')"
);
writeFile('src/app/discussions/[id]/page.tsx', thread);
console.log('  ✅ src/app/discussions/[id]/page.tsx');

// ============ 8. auth/reset-password/page.tsx ============
let resetPw = readFile('src/app/auth/reset-password/page.tsx');
// Remove isThai declaration
resetPw = resetPw.replace("  const isThai = locale === 'th'\r\n", '');
// Replace all isThai patterns
resetPw = resetPw.replace(
  "isThai ? 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่' : 'Invalid reset link. Please request a new one.'",
  "t('reset.invalidLink')"
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters'",
  "t('reset.passwordMin')"
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านไม่แข็งแกร่งพอ ต้องมีตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์' : 'Password is not strong enough. Add uppercase, numbers, or symbols.'",
  "t('reset.passwordWeak')"
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'",
  "t('reset.passwordMismatch')"
);
resetPw = resetPw.replace(
  "isThai ? 'รีเซ็ตรหัสผ่านไม่สำเร็จ' : 'Failed to reset password'",
  "t('reset.failed')"
);
resetPw = resetPw.replace(
  "isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error'",
  "t('reset.networkError')"
);
resetPw = resetPw.replace(
  "isThai ? 'กำลังตรวจสอบ...' : 'Verifying...'",
  "t('reset.verifying')"
);
resetPw = resetPw.replace(
  "isThai ? 'ลิงก์ไม่ถูกต้อง' : 'Invalid Link'",
  "t('reset.invalidLinkTitle')"
);
resetPw = resetPw.replace(
  "isThai ? 'กลับไปเข้าสู่ระบบ' : 'Back to Sign In'",
  "t('reset.backToSignIn')"
);
resetPw = resetPw.replace(
  "isThai ? 'รีเซ็ตรหัสผ่านสำเร็จ!' : 'Password Reset Successfully!'",
  "t('reset.successTitle')"
);
resetPw = resetPw.replace(
  "isThai ? 'กำลังเปลี่ยนหน้า...' : 'Redirecting...'",
  "t('reset.redirecting')"
);
resetPw = resetPw.replace(
  "isThai ? 'ตั้งรหัสผ่านใหม่' : 'Set your new password'",
  "t('reset.setNewPassword')"
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านใหม่' : 'New Password'",
  "t('reset.newPassword')"
);
resetPw = resetPw.replace(
  "isThai ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'",
  "t('reset.atLeast8')"
);
resetPw = resetPw.replace(
  "isThai ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'",
  "t('reset.confirmPassword')"
);
resetPw = resetPw.replace(
  "isThai ? 'กรอกรหัสผ่านอีกครั้ง' : 'Enter password again'",
  "t('reset.enterPasswordAgain')"
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'",
  "t('reset.passwordMismatch')"
);
resetPw = resetPw.replace(
  "✓ {isThai ? 'รหัสผ่านตรงกัน' : 'Passwords match'}",
  "✓ {t('reset.passwordsMatch')}"
);
resetPw = resetPw.replace(
  "loading ? (isThai ? 'กรุณารอสักครู่...' : 'Please wait...') : (isThai ? 'ตั้งรหัสผ่านใหม่' : 'Reset Password')",
  "loading ? t('reset.pleaseWait') : t('reset.resetPassword')"
);
// Password strength labels (triple nested ternary in Thai)
resetPw = resetPw.replace(
  `isThai ? (\n                      pwStrength.score <= 1 ? 'อ่อนมาก' :\n                      pwStrength.score === 2 ? 'อ่อน' :\n                      pwStrength.score === 3 ? 'พอใช้' :\n                      pwStrength.score === 4 ? 'แข็งแกร่ง' : 'แข็งแกร่งมาก'\n                    ) : pwStrength.label`,
  `pwStrength.score <= 1 ? t('reset.veryWeak') :\n                      pwStrength.score === 2 ? t('reset.weak') :\n                      pwStrength.score === 3 ? t('reset.fair') :\n                      pwStrength.score === 4 ? t('reset.strong') : t('reset.veryStrong')`
);
resetPw = resetPw.replace(
  "isThai ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์' : 'Password must be at least 8 characters with uppercase, numbers, or symbols'",
  "t('reset.passwordRequirement')"
);
writeFile('src/app/auth/reset-password/page.tsx', resetPw);
console.log('  ✅ src/app/auth/reset-password/page.tsx');

console.log('\nPhase 1 complete (small to medium files)');