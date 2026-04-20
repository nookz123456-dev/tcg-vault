const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

function readFile(relPath) {
  return fs.readFileSync(path.join(cwd, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(cwd, relPath), content);
}

// ============ seller/apply/page.tsx ============
let seller = readFile('src/app/seller/apply/page.tsx');
// Remove isThai declaration
seller = seller.replace("  const isThai = locale === 'th'\r\n", '');
// Replace all isThai patterns
seller = seller.replace(
  "isThai ? 'กรุณาเข้าสู่ระบบก่อนสมัครผู้ขาย' : 'Please sign in to apply as a seller'",
  "t('seller.signInToApply')"
);
seller = seller.replace(
  "isThai ? 'เข้าสู่ระบบ' : 'Sign In'",
  "t('common.signIn')"
);
seller = seller.replace(
  "isThai ? 'รอการตรวจสอบ' : 'Pending Verification'",
  "t('seller.pendingTitle')"
);
seller = seller.replace(
  "isThai ? 'ใบสมัครของคุณอยู่ระหว่างตรวจสอบ' : 'Your application is being reviewed.'",
  "t('seller.pendingDesc')"
);
seller = seller.replace(
  "isThai ? 'ผู้ขายที่ผ่านการตรวจสอบ' : 'Verified Seller'",
  "t('seller.verifiedTitle')"
);
seller = seller.replace(
  "isThai ? 'คุณเป็นผู้ขายที่ผ่านการตรวจสอบแล้ว' : 'You are a verified seller.'",
  "t('seller.verifiedDesc')"
);
seller = seller.replace(
  "isThai ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'",
  "t('seller.applyTitle')"
);
seller = seller.replace(
  "isThai ? 'กรอกข้อมูลเพื่อยืนยันตัวตน เราตรวจสอบเพื่อความปลอดภัยของลูกค้า' : 'Verify your identity to start selling. We verify for buyer safety.'",
  "t('seller.applyDesc')"
);
seller = seller.replace(
  "isThai ? 'ส่งใบสมัครสำเร็จ! เราจะตรวจสอบและแจ้งผลให้คุณทราบ' : 'Application submitted! We will review and notify you.'",
  "t('seller.applicationSubmitted')"
);
seller = seller.replace(
  "isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error'",
  "t('seller.networkError')"
);
// Identity section
seller = seller.replace(
  "isThai ? 'ข้อมูลประจำตัว' : 'Identity'",
  "t('seller.identity')"
);
seller = seller.replace(
  "isThai ? 'ชื่อ-นามสกุลจริง' : 'Full Legal Name'",
  "t('seller.fullLegalName')"
);
seller = seller.replace(
  "isThai ? 'ชื่อ นามสกุล ตามบัตรประชาชน' : 'Name as shown on ID card'",
  "t('seller.nameOnId')"
);
seller = seller.replace(
  "isThai ? 'วันเดือนปีเกิด' : 'Date of Birth'",
  "t('seller.dateOfBirth')"
);
seller = seller.replace(
  "isThai ? 'เลขบัตรประชาชน' : 'National ID'",
  "t('seller.nationalId')"
);
// Contact section
seller = seller.replace(
  "isThai ? 'ข้อมูลติดต่อ' : 'Contact'",
  "t('seller.contact')"
);
seller = seller.replace(
  "isThai ? 'เบอร์โทรศัพท์' : 'Phone'",
  "t('seller.phone')"
);
seller = seller.replace(
  "isThai ? 'ที่อยู่' : 'Address'",
  "t('seller.address')"
);
seller = seller.replace(
  "isThai ? 'บ้านเลขที่ ซอย ถนน' : 'House number, Soi, Road'",
  "t('seller.addressPlaceholder')"
);
seller = seller.replace(
  "isThai ? 'ตำบล/แขวง' : 'District'",
  "t('seller.district')"
);
seller = seller.replace(
  "isThai ? 'อำเภอ/เขต' : 'City'",
  "t('seller.city')"
);
seller = seller.replace(
  "isThai ? 'จังหวัด' : 'Province'",
  "t('seller.province')"
);
seller = seller.replace(
  "isThai ? '-- เลือกจังหวัด --' : '-- Select --'",
  "t('seller.selectProvince')"
);
seller = seller.replace(
  "isThai ? 'รหัสไปรษณีย์' : 'Postal Code'",
  "t('seller.postalCode')"
);
// Verification docs
seller = seller.replace(
  "isThai ? 'เอกสารยืนยันตัวตน' : 'Verification Documents'",
  "t('seller.verificationDocs')"
);
seller = seller.replace(
  "isThai ? 'อัปโหลดรูปบัตรประชาชนและรูปถ่ายคู่บัตร' : 'Upload your ID card photo and selfie with ID.'",
  "t('seller.verificationDocsDesc')"
);
seller = seller.replace(
  "isThai ? 'รูปบัตรประชาชน' : 'ID Card Photo'",
  "t('seller.idCardPhoto')"
);
seller = seller.replace(
  "isThai ? 'อัปโหลดรูปบัตร' : 'Upload ID photo'",
  "t('seller.uploadIdPhoto')"
);
seller = seller.replace(
  "isThai ? 'รูปถ่ายคู่บัตร' : 'Selfie with ID'",
  "t('seller.selfieWithId')"
);
seller = seller.replace(
  "isThai ? 'อัปโหลดรูปถ่ายคู่บัตร' : 'Upload selfie'",
  "t('seller.uploadSelfie')"
);
// Shop info
seller = seller.replace(
  "isThai ? 'ข้อมูลร้านค้า' : 'Shop Info'",
  "t('seller.shopInfo')"
);
seller = seller.replace(
  "isThai ? 'ไม่จำเป็น' : 'Optional'",
  "t('seller.optional')"
);
seller = seller.replace(
  "isThai ? 'ชื่อร้าน' : 'Shop Name'",
  "t('seller.shopName')"
);
seller = seller.replace(
  "isThai ? 'ชื่อร้านค้า' : 'Your shop name'",
  "t('seller.shopNamePlaceholder')"
);
seller = seller.replace(
  "isThai ? 'รายละเอียด' : 'Description'",
  "t('seller.description')"
);
seller = seller.replace(
  "isThai ? 'เกี่ยวกับร้านค้าของคุณ...' : 'About your shop...'",
  "t('seller.shopDescPlaceholder')"
);
// Submit button
seller = seller.replace(
  "loading ? (isThai ? 'กำลังส่ง...' : 'Submitting...') : (isThai ? 'ส่งใบสมัคร' : 'Submit Application')",
  "loading ? t('seller.submitting') : t('seller.submitApplication')"
);
writeFile('src/app/seller/apply/page.tsx', seller);
console.log('✅ src/app/seller/apply/page.tsx');

// ============ admin/page.tsx ============
let admin = readFile('src/app/admin/page.tsx');
// Remove old isThai detection
admin = admin.replace("  const isThai = t('common.ago') === 'ที่แล้ว'\r\n", '');
// Add useLocale import
admin = admin.replace("import { useT } from '@/lib/i18n'", "import { useT, useLocale } from '@/lib/i18n'");
// Add locale + isThai
admin = admin.replace(
  "  const t = useT()\r\n",
  "  const t = useT()\r\n  const { locale } = useLocale()\r\n  const isThai = locale === 'th'\r\n"
);
// Not-signed-in screen
admin = admin.replace(
  "isThai ? 'กรุณาเข้าสู่ระบบ' : 'Please sign in to access admin panel'",
  "t('admin.signInToAccess')"
);
admin = admin.replace(
  "isThai ? 'เข้าสู่ระบบ' : 'Sign In'",
  "t('common.signIn')"
);
// Access denied screen
admin = admin.replace(
  "isThai ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'",
  "t('admin.accessDenied')"
);
admin = admin.replace(
  "isThai ? 'ต้องมีสิทธิ์ผู้ดูแลระบบ' : 'You need admin privileges to access this page.'",
  "t('admin.needAdmin')"
);
admin = admin.replace(
  "isThai ? 'กลับหน้าชุมชน' : 'Back to Community'",
  "t('admin.backToCommunity')"
);
// Header
admin = admin.replace(
  "isThai ? 'ผู้ดูแลระบบ' : 'Admin Panel'",
  "t('admin.panel')"
);
admin = admin.replace(
  "isThai ? 'จัดการผู้ใช้ ผู้ขาย เนื้อหา และประกาศ' : 'Manage users, sellers, content & announcements'",
  "t('admin.manageDesc')"
);
// Tab labels - replace inline {isThai ? tb.label : tb.labelEn}
admin = admin.replace(
  "{isThai ? tb.label : tb.labelEn}",
  "{t(`admin.${tb.key}`) || tb.labelEn}"
);
// Overview stats
admin = admin.replace(
  "isThai ? 'ผู้ใช้' : 'Users'",
  "t('admin.users')"
);
admin = admin.replace(
  "isThai ? 'กระทู้' : 'Threads'",
  "t('admin.threads')"
);
admin = admin.replace(
  "isThai ? 'ความคิดเห็น' : 'Comments'",
  "t('admin.comments')"
);
admin = admin.replace(
  "isThai ? 'รอตรวจสอบ' : 'Pending'",
  "t('admin.pending')"
);
admin = admin.replace(
  "isThai ? 'ผู้ขายแล้ว' : 'Verified'",
  "t('admin.verified')"
);
admin = admin.replace(
  "isThai ? 'เทรดสำเร็จ' : 'Trades'",
  "t('admin.completedTrades')"
);
// Recent activity
admin = admin.replace(
  "isThai ? 'กิจกรรมล่าสุด' : 'Recent Activity'",
  "t('admin.recentActivity')"
);
admin = admin.replace(
  "isThai ? 'ยังไม่มีกิจกรรม' : 'No activity yet'",
  "t('admin.noActivity')"
);
// Quick actions
admin = admin.replace(
  "isThai ? 'จัดการผู้ขาย' : 'Manage Sellers'",
  "t('admin.manageSellers')"
);
admin = admin.replace(
  "isThai ? 'จัดการผู้ใช้' : 'Manage Users'",
  "t('admin.manageUsers')"
);
admin = admin.replace(
  "isThai ? 'ประกาศ' : 'Announcements'",
  "t('admin.announcementsLabel')"
);
admin = admin.replace(
  "isThai ? 'ดูคอมเมนต์' : 'View Comments'",
  "t('admin.viewComments')"
);
admin = admin.replace(
  "isThai ? 'รอตรวจสอบ' : 'pending'",
  "t('admin.pendingShort')"
);
// Users tab
admin = admin.replace(
  "isThai ? 'ไม่พบผู้ใช้' : 'No users found'",
  "t('admin.noUsersFound')"
);
admin = admin.replace(
  "isThai ? 'ค้นหาผู้ใช้...' : 'Search users...'",
  "t('admin.searchUsers')"
);
admin = admin.replace(
  "isThai ? 'ระงับ' : 'Suspended'",
  "t('admin.suspended')"
);
// Sellers tab - filter buttons
admin = admin.replace(
  "status === 'all' ? (isThai ? 'ทั้งหมด' : 'All')",
  "status === 'all' ? t('admin.all')"
);
admin = admin.replace(
  "status === 'pending' ? (isThai ? 'รอตรวจสอบ' : 'Pending')",
  "status === 'pending' ? t('admin.pending')"
);
admin = admin.replace(
  "status === 'verified' ? (isThai ? 'ผ่านแล้ว' : 'Verified')",
  "status === 'verified' ? t('admin.verified')"
);
admin = admin.replace(
  "status === 'rejected' ? (isThai ? 'ปฏิเสธ' : 'Rejected')",
  "status === 'rejected' ? t('admin.rejected')"
);
// The 'Suspended' one in seller filter
admin = admin.replace(
  "(isThai ? 'ระงับ' : 'Suspended')",
  "t('admin.suspended')"
);
// No sellers
admin = admin.replace(
  "isThai ? 'ไม่มีผู้ขายในหมวดนี้' : 'No sellers in this category'",
  "t('admin.noSellers')"
);
// Seller status badges
admin = admin.replace(
  "app.status === 'pending' ? (isThai ? 'รอตรวจสอบ' : 'Pending')",
  "app.status === 'pending' ? t('admin.pending')"
);
admin = admin.replace(
  "app.status === 'verified' ? (isThai ? 'ผ่านแล้ว' : 'Verified')",
  "app.status === 'verified' ? t('admin.verified')"
);
admin = admin.replace(
  "app.status === 'rejected' ? (isThai ? 'ปฏิเสธ' : 'Rejected')",
  "app.status === 'rejected' ? t('admin.rejected')"
);
// Approve/reject buttons
admin = admin.replace(
  "✅ {isThai ? 'อนุมัติ' : 'Approve'}",
  "✅ {t('admin.approve')}"
);
admin = admin.replace(
  "❌ {isThai ? 'ปฏิเสธ' : 'Reject'}",
  "❌ {t('admin.reject')}"
);
admin = admin.replace(
  "prompt(isThai ? 'เหตุผลที่ปฏิเสธ:' : 'Rejection reason:')",
  "prompt(t('admin.rejectionReason'))"
);
// Threads tab
admin = admin.replace(
  "isThai ? 'ไม่มีกระทู้' : 'No threads'",
  "t('admin.noThreads')"
);
admin = admin.replace(
  "th.is_pinned ? (isThai ? 'ยกเลิกปักหมุด' : 'Unpin') : (isThai ? 'ปักหมุด' : 'Pin')",
  "th.is_pinned ? t('admin.unpin') : t('admin.pin')"
);
admin = admin.replace(
  "isThai ? 'ลบ' : 'Delete'",
  "t('admin.deleteThread')"
);
admin = admin.replace(
  "confirm(isThai ? 'ลบกระทู้นี้?' : 'Delete this thread?')",
  "confirm(t('admin.deleteThreadConfirm'))"
);
// Comments tab
admin = admin.replace(
  "isThai ? 'ไม่มีความคิดเห็น' : 'No comments'",
  "t('admin.noComments')"
);
admin = admin.replace(
  "confirm(isThai ? 'ลบความคิดเห็นนี้?' : 'Delete this comment?')",
  "confirm(t('admin.deleteCommentConfirm'))"
);
// Announcements tab
admin = admin.replace(
  "isThai ? 'ประกาศ' : 'Announcements'",
  "t('admin.announcementsLabel')"
);
admin = admin.replace(
  "isThai ? 'สร้างประกาศใหม่' : 'New Announcement'",
  "t('admin.newAnnouncement')"
);
admin = admin.replace(
  "isThai ? 'หัวข้อประกาศ' : 'Announcement title'",
  "t('admin.announcementTitle')"
);
admin = admin.replace(
  "isThai ? 'เนื้อหาประกาศ...' : 'Announcement content...'",
  "t('admin.announcementContent')"
);
admin = admin.replace(
  "isThai ? 'ต่ำ' : 'Low'",
  "t('admin.low')"
);
admin = admin.replace(
  "isThai ? 'ปกติ' : 'Normal'",
  "t('admin.normal')"
);
admin = admin.replace(
  "isThai ? 'สูง' : 'High'",
  "t('admin.high')"
);
admin = admin.replace(
  "isThai ? 'เร่งด่วน' : 'Urgent'",
  "t('admin.urgent')"
);
admin = admin.replace(
  "isThai ? 'ยกเลิก' : 'Cancel'",
  "t('common.cancel')"
);
admin = admin.replace(
  "isThai ? 'เผยแพร่' : 'Publish'",
  "t('admin.publish')"
);
admin = admin.replace(
  "isThai ? 'ยังไม่มีประกาศ' : 'No announcements yet'",
  "t('admin.noAnnouncements')"
);
admin = admin.replace(
  "confirm(isThai ? 'ลบประกาศนี้?' : 'Delete this announcement?')",
  "confirm(t('admin.deleteAnnouncementConfirm'))"
);
writeFile('src/app/admin/page.tsx', admin);
console.log('✅ src/app/admin/page.tsx');

// ============ login/page.tsx ============
let login = readFile('src/app/login/page.tsx');
// Remove isThai declaration
login = login.replace(" const isThai = locale === 'th'\r\n", '');
// Replace all isThai patterns
login = login.replace(
  "isThai ? 'การยืนยันล้มเหลว กรุณาลองใหม่' : 'Captcha verification failed. Please try again.'",
  "t('login.captchaFailed')"
);
login = login.replace(
  "isThai ? 'กรุณากรอกชื่อผู้ใช้' : 'Username is required'",
  "t('login.usernameRequired')"
);
login = login.replace(
  "isThai ? 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' : 'Username must be at least 3 characters'",
  "t('login.usernameMin')"
);
login = login.replace(
  "isThai ? 'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _' : 'Username can only contain letters, numbers, and _'",
  "t('login.usernameChars')"
);
login = login.replace(
  "isThai ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters'",
  "t('login.passwordMin8')"
);
login = login.replace(
  "isThai ? 'รหัสผ่านไม่แข็งแกร่งพอ ต้องมีตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์' : 'Password is not strong enough. Add uppercase, numbers, or symbols'",
  "t('login.passwordWeak')"
);
login = login.replace(
  "isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'",
  "t('login.passwordMismatch')"
);
login = login.replace(
  "isThai ? 'กรุณายืนยัน Captcha' : 'Please complete the captcha verification.'",
  "t('login.completeCaptcha')"
);
login = login.replace(
  "isThai ? 'การยืนยันล้มเหลว' : 'Captcha verification failed.'",
  "t('login.captchaVerificationFailed')"
);
login = login.replace(
  "isThai ? 'ไม่สามารถยืนยันได้ กรุณาลองใหม่ภายหลัง' : 'Captcha verification unavailable.'",
  "t('login.captchaUnavailable')"
);
login = login.replace(
  "isThai ? 'ส่งลิงก์ไม่สำเร็จ' : 'Failed to send magic link'",
  "t('login.magicLinkFailed')"
);
login = login.replace(
  "isThai ? 'ส่งลิงก์เข้าอีเมลแล้ว! ตรวจสอบกล่องจดหมายของคุณ' : 'Magic link sent! Check your email.'",
  "t('login.magicLinkSent')"
);
login = login.replace(
  "isThai ? 'ข้อผิดพลาดเครือข่าย' : 'Network error'",
  "t('login.networkError')"
);
login = login.replace(
  "isThai ? 'ส่งอีเมลรีเซ็ตไม่สำเร็จ' : 'Failed to send reset email'",
  "t('login.resetEmailFailed')"
);
login = login.replace(
  "isThai ? 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว' : 'Password reset link sent to your email.'",
  "t('login.resetLinkSent')"
);
login = login.replace(
  "isThai ? 'ข้อผิดพลาดการตั้งค่า กรุณาลองใหม่ภายหลัง' : 'Configuration error. Please try again later.'",
  "t('login.configError')"
);
login = login.replace(
  "isThai ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'This email is already registered.'",
  "t('login.alreadyRegistered')"
);
login = login.replace(
  "isThai ? 'สมัครมากเกินไป กรุณาลองใหม่ภายหลัง' : 'Too many signup attempts. Please try again later.'",
  "t('login.tooManyAttempts')"
);
login = login.replace(
  "isThai ? 'สมัครไม่สำเร็จ' : 'Signup failed.'",
  "t('login.signupFailed')"
);
login = login.replace(
  "isThai ? 'สร้างบัญชีสำเร็จ! กำลังเปลี่ยนหน้า...' : 'Account created! Redirecting...'",
  "t('login.accountCreated')"
);
login = login.replace(
  "isThai ? 'สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ' : 'Account created! You can now log in.'",
  "t('login.accountCreatedLogin')"
);
login = login.replace(
  "isThai ? 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...' : 'Logged in! Redirecting...'",
  "t('login.loggedIn')"
);
login = login.replace(
  "isThai ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Login failed.'",
  "t('login.loginFailed')"
);
login = login.replace(
  "isThai ? 'ข้อผิดพลาดเครือข่าย กรุณาลองใหม่' : 'Network error. Please try again.'",
  "t('login.networkError')"
);
// Title variable
login = login.replace(
  "mode === 'login' ? (isThai ? 'เข้าสู่ระบบ' : 'Sign In')\n : mode === 'signup' ? (isThai ? 'สร้างบัญชี' : 'Create Account')\n : mode === 'magic' ? (isThai ? 'เข้าสู่ระบบด้วยลิงก์' : 'Sign in with Magic Link')\n : (isThai ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password')",
  "mode === 'login' ? t('login.signIn')\n : mode === 'signup' ? t('login.createAccount')\n : mode === 'magic' ? t('login.magicLink')\n : t('login.resetPassword')"
);
// Subtitle under logo
login = login.replace(
  "isThai ? 'จัดการคอลเลกชันการ์ดของคุณ' : 'Your card collection, tracked.'",
  "t('login.yourCardCollection')"
);
// Don't have account text
login = login.replace(
  "isThai ? 'ยังไม่มีบัญชี? ' : \"Don't have an account? \"",
  "t('login.noAccountPrefix')"
);
login = login.replace(
  "isThai ? 'สมัครใหม่' : 'Sign up'",
  "t('login.signUpNew')"
);
login = login.replace(
  "isThai ? 'มีบัญชีอยู่แล้ว? ' : 'Already have an account? '",
  "t('login.hasAccountPrefix')"
);
login = login.replace(
  "isThai ? 'เข้าสู่ระบบ' : 'Sign in'",
  "t('login.signIn')"
);
// Magic link form
login = login.replace(
  "isThai ? 'อีเมล' : 'Email'",
  "t('login.email')"
);
login = login.replace(
  "isThai ? 'เราจะส่งลิงก์เข้าอีเมลของคุณ — คลิกครั้งเดียวเข้าได้เลย ไม่ต้องจำรหัสผ่าน!' : \"We'll send a login link to your email — click once and you're in. No password needed!\"",
  "t('login.magicLinkDesc')"
);
login = login.replace(
  "loading ? (isThai ? 'กำลังส่ง...' : 'Sending...') : (isThai ? 'ส่งลิงก์เข้าระบบ' : 'Send Magic Link')",
  "loading ? t('login.sending') : t('login.sendMagicLink')"
);
login = login.replace(
  "isThai ? '← กลับไปเข้าสู่ระบบ' : '← Back to sign in'",
  "t('login.backToSignIn')"
);
// Forgot password form
login = login.replace(
  "isThai ? 'อีเมลที่สมัครไว้' : 'Registered email'",
  "t('login.registeredEmail')"
);
login = login.replace(
  "loading ? (isThai ? 'กำลังส่ง...' : 'Sending...') : (isThai ? 'ส่งลิงก์รีเซ็ตรหัสผ่าน' : 'Send Reset Link')",
  "loading ? t('login.sending') : t('login.sendResetLink')"
);
// Username field
login = login.replace(
  "isThai ? 'ชื่อผู้ใช้' : 'Username'",
  "t('login.username')"
);
login = login.replace(
  "isThai ? 'ชื่อที่ต้องการใช้ (ตัวอักษร ตัวเลข _)' : 'Choose a username (letters, numbers, _)'",
  "t('login.usernamePlaceholder')"
);
// Email field (login/signup form)
login = login.replace(
  "isThai ? 'รหัสผ่าน' : 'Password'",
  "t('login.password')"
);
// Password placeholder
login = login.replace(
  "mode === 'signup' ? (isThai ? 'อย่างน้อย 8 ตัวอักษร' : 'Min 8 characters') : '••••••••'",
  "mode === 'signup' ? t('login.min8Chars') : '••••••••'"
);
// Password strength labels
login = login.replace(
  `isThai ? (\n                    !pwStrength || pwStrength.score <= 1 ? 'อ่อนมาก' :\n                    pwStrength.score === 2 ? 'อ่อน' :\n                    pwStrength.score === 3 ? 'พอใช้' :\n                    pwStrength.score === 4 ? 'แข็งแกร่ง' : 'แข็งแกร่งมาก'\n                  ) : (pwStrength?.label || 'Weak')`,
  `!pwStrength || pwStrength.score <= 1 ? t('login.veryWeak') :\n                    pwStrength.score === 2 ? t('login.weak') :\n                    pwStrength.score === 3 ? t('login.fair') :\n                    pwStrength.score === 4 ? t('login.strongLabel') : t('login.veryStrong')`
);
// Password requirements list
login = login.replace(
  "isThai ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'",
  "t('login.min8Chars')"
);
login = login.replace(
  "isThai ? 'ตัวพิมพ์ใหญ่และเล็ก' : 'Uppercase & lowercase'",
  "t('login.upperLower')"
);
login = login.replace(
  "isThai ? 'ตัวเลข' : 'Number'",
  "t('login.number')"
);
login = login.replace(
  "isThai ? 'สัญลักษณ์พิเศษ (!@#$...)' : 'Special character (!@#$...)'",
  "t('login.specialChar')"
);
// Confirm password
login = login.replace(
  "isThai ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'",
  "t('login.confirmPassword')"
);
login = login.replace(
  "isThai ? 'กรอกรหัสผ่านอีกครั้ง' : 'Enter password again'",
  "t('login.confirmPasswordPlaceholder')"
);
// Passwords match/mismatch in login
login = login.replace(
  "isThai ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'",
  "t('login.passwordMismatch')"
);
login = login.replace(
  "✓ {isThai ? 'รหัสผ่านตรงกัน' : 'Passwords match'}",
  "✓ {t('login.passwordsMatch')}"
);
// Forgot password link
login = login.replace(
  "isThai ? 'ลืมรหัสผ่าน?' : 'Forgot password?'",
  "t('login.forgotPassword')"
);
// Submit button
login = login.replace(
  "loading ? (isThai ? 'กรุณารอสักครู่...' : 'Please wait...') :\n mode === 'login' ? (isThai ? 'เข้าสู่ระบบ' : 'Sign In') :\n (isThai ? 'สร้างบัญชี' : 'Create Account')",
  "loading ? t('login.pleaseWait') :\n mode === 'login' ? t('login.signIn') :\n t('login.createAccount')"
);
// Divider "or"
login = login.replace(
  "isThai ? 'หรือ' : 'or'",
  "t('login.or')"
);
// Magic link option button
login = login.replace(
  "isThai ? 'เข้าสู่ระบบด้วยลิงก์อีเมล' : 'Sign in with Magic Link'",
  "t('login.signInWithMagicLink')"
);
// Guest mode button
login = login.replace(
  "isThai ? 'เข้าชมแบบไม่ล็อกอิน (เก็บข้อมูลในเครื่อง)' : 'Continue as Guest (saved locally only)'",
  "t('login.continueAsGuest')"
);
// Footer
login = login.replace(
  "isThai ? 'ข้อมูลเก็บอย่างปลอดภัยบน Supabase · โหมดไม่ล็อกอินเก็บในเครื่อง' : 'Data stored securely on Supabase · Guest mode uses local storage'",
  "t('login.dataSecure')"
);
writeFile('src/app/login/page.tsx', login);
console.log('✅ src/app/login/page.tsx');

console.log('\nPhase 2 complete (large files)');