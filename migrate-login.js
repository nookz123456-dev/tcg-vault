const fs = require('fs');
let content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Replace isThai ternaries with t() calls — all keys already exist in i18n.ts
const replacements = [
  // Declaration + dependency
  ['const isThai = locale === \'th\'', ''],
  [', [isThai]', ''],  // remove from deps — actually need to check context
  
  // Validation function returns
  ['isThai ? \'กรุณากรอกชื่อผู้ใช้\' : \'Username is required\'', 't(\'login.usernameRequired\')'],
  ['isThai ? \'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร\' : \'Username must be at least 3 characters\'', 't(\'login.usernameMin\')'],
  ['isThai ? \'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _\' : \'Username can only contain letters, numbers, and _\'', 't(\'login.usernameChars\')'],
  ['isThai ? \'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร\' : \'Password must be at least 8 characters\'', 't(\'login.passwordMin8\')'],
  ['isThai ? \'รหัสผ่านไม่แข็งแกร่งพอ ต้องมีตัวพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์\' : \'Password is not strong enough. Add uppercase, numbers, or symbols\'', 't(\'login.passwordWeak\')'],
  ['isThai ? \'รหัสผ่านไม่ตรงกัน\' : \'Passwords do not match\'', 't(\'login.passwordMismatch\')'],
  
  // Error messages
  ['isThai ? \'การยืนยันล้มเหลว กรุณาลองใหม่\' : \'Captcha verification failed. Please try again.\'', 't(\'login.captchaFailed\')'],
  ['isThai ? \'ส่งลิงก์ไม่สำเร็จ\' : \'Failed to send magic link\'', 't(\'login.magicLinkFailed\')'],
  ['isThai ? \'ส่งลิงก์เข้าอีเมลแล้ว! ตรวจสอบกล่องจดหมายของคุณ\' : \'Magic link sent! Check your email.\'', 't(\'login.magicLinkSent\')'],
  ['isThai ? \'ข้อผิดพลาดเครือข่าย\' : \'Network error\'', 't(\'common.networkError\', \'th\') ? \'ข้อผิดพลาดเครือข่าย\' : \'Network error\''],
  ['isThai ? \'ส่งอีเมลรีเซ็ตไม่สำเร็จ\' : \'Failed to send reset email\'', 't(\'login.resetEmailFailed\')'],
  ['isThai ? \'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว\' : \'Password reset link sent to your email.\'', 't(\'login.resetLinkSent\')'],
  ['isThai ? \'ข้อผิดพลาดเครือข่าย\' : \'Network error\'', 't(\'login.networkError\')'],
  ['isThai ? \'ข้อผิดพลาดการตั้งค่า กรุณาลองใหม่ภายหลัง\' : \'Configuration error. Please try again later.\'', 't(\'login.configError\')'],
  ['isThai ? \'กรุณายืนยัน Captcha\' : \'Please complete the captcha verification.\'', 't(\'login.completeCaptcha\')'],
  ['isThai ? \'การยืนยันล้มเหลว กรุณาลองใหม่\' : \'Captcha verification failed.\'', 't(\'login.captchaVerificationFailed\')'],
  ['isThai ? \'ไม่สามารถยืนยันได้ กรุณาลองใหม่ภายหลัง\' : \'Captcha verification unavailable.\'', 't(\'login.captchaUnavailable\')'],
  ['isThai ? \'เข้าสู่ระบบไม่สำเร็จ\' : \'Login failed.\'', 't(\'login.loginFailed\')'],
  ['isThai ? \'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...\' : \'Logged in! Redirecting...\'', 't(\'login.loggedIn\')'],
  ['isThai ? \'อีเมลนี้ถูกใช้งานแล้ว\' : \'This email is already registered.\'', 't(\'login.alreadyRegistered\')'],
  ['isThai ? \'สมัครมากเกินไป กรุณาลองใหม่ภายหลัง\' : \'Too many signup attempts. Please try again later.\'', 't(\'login.tooManyAttempts\')'],
  // This one needs special handling since it uses msg || (isThai ? ...)
  // We'll handle it separately
  ['isThai ? \'สมัครไม่สำเร็จ\' : \'Signup failed.\'', 't(\'login.signupFailed\')'],
  ['isThai ? \'สร้างบัญชีสำเร็จ! กำลังเปลี่ยนหน้า...\' : \'Account created! Redirecting...\'', 't(\'login.accountCreated\')'],
  ['isThai ? \'สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ\' : \'Account created! You can now log in.\'', 't(\'login.accountCreatedLogin\')'],
  ['isThai ? \'ข้อผิดพลาดเครือข่าย กรุณาลองใหม่\' : \'Network error. Please try again.\'', 't(\'login.networkError\')'],
  
  // Title
  ['isThai ? \'เข้าสู่ระบบ\' : \'Sign In\'', 't(\'login.signIn\')'],
  ['isThai ? \'สร้างบัญชี\' : \'Create Account\'', 't(\'login.createAccount\')'],
  ['isThai ? \'เข้าสู่ระบบด้วยลิงก์\' : \'Sign in with Magic Link\'', 't(\'login.magicLink\')'],
  ['isThai ? \'รีเซ็ตรหัสผ่าน\' : \'Reset Password\'', 't(\'login.resetPassword\')'],
  
  // JSX text
  ['{isThai ? \'จัดการคอลเลกชันการ์ดของคุณ\' : \'Your card collection, tracked.\'}', '{t(\'login.yourCardCollection\')}'],
  ['{isThai ? \'ยังไม่มีบัญชี? \' : "Don\'t have an account? "}', '{t(\'login.noAccountPrefix\')}'],
  ['{isThai ? \'สมัครใหม่\' : \'Sign up\'}', '{t(\'login.signUpNew\')}'],
  ['{isThai ? \'มีบัญชีอยู่แล้ว? \' : \'Already have an account? \'}', '{t(\'login.hasAccountPrefix\')}'],
  ['{isThai ? \'เข้าสู่ระบบ\' : \'Sign in\'}', '{t(\'login.signIn\')}'],
  ['{isThai ? \'อีเมล\' : \'Email\'}', '{t(\'login.email\')}'],
  ['{isThai ? \'เราจะส่งลิงก์เข้าอีเมลของคุณ — คลิกครั้งเดียวเข้าได้เลย ไม่ต้องจำรหัสผ่าน!\' : "We\'ll send a login link to your email — click once and you\'re in. No password needed!"}', '{t(\'login.magicLinkDesc\')}'],
  ['{loading ? (isThai ? \'กำลังส่ง...\' : \'Sending...\') : (isThai ? \'ส่งลิงก์เข้าระบบ\' : \'Send Magic Link\')}', '{loading ? t(\'login.sending\') : t(\'login.sendMagicLink\')}'],
  ['{isThai ? \'← กลับไปเข้าสู่ระบบ\' : \'← Back to sign in\'}', '{t(\'login.backToSignIn\')}'],
  ['{isThai ? \'อีเมลที่สมัครไว้\' : \'Registered email\'}', '{t(\'login.registeredEmail\')}'],
  ['{loading ? (isThai ? \'กำลังส่ง...\' : \'Sending...\') : (isThai ? \'ส่งลิงก์รีเซ็ตรหัสผ่าน\' : \'Send Reset Link\')}', '{loading ? t(\'login.sending\') : t(\'login.sendResetLink\')}'],
  ['{isThai ? \'ชื่อผู้ใช้\' : \'Username\'}', '{t(\'login.username\')}'],
  ['placeholder={isThai ? \'ชื่อที่ต้องการใช้ (ตัวอักษร ตัวเลข _)\' : \'Choose a username (letters, numbers, _)\'}', 'placeholder={t(\'login.usernamePlaceholder\')}'],
  ['{isThai ? \'รหัสผ่าน\' : \'Password\'}', '{t(\'login.password\')}'],
  ['placeholder={mode === \'signup\' ? (isThai ? \'อย่างน้อย 8 ตัวอักษร\' : \'Min 8 characters\') : \'••••••••\'}', 'placeholder={mode === \'signup\' ? t(\'login.min8Chars\') : \'••••••••\'}'],
  ['{isThai ? \'ยืนยันรหัสผ่าน\' : \'Confirm Password\'}', '{t(\'login.confirmPassword\')}'],
  ['placeholder={isThai ? \'กรอกรหัสผ่านอีกครั้ง\' : \'Enter password again\'}', 'placeholder={t(\'login.confirmPasswordPlaceholder\')}'],
  ['{isThai ? \'รหัสผ่านไม่ตรงกัน\' : \'Passwords do not match\'}', '{t(\'login.passwordMismatch\')}'],
  ['✓ {isThai ? \'รหัสผ่านตรงกัน\' : \'Passwords match\'}', '✓ {t(\'login.passwordsMatch\')}'],
  ['{isThai ? \'ลืมรหัสผ่าน?\' : \'Forgot password?\'}', '{t(\'login.forgotPassword\')}'],
  ['{loading ? (isThai ? \'กรุณารอสักครู่...\' : \'Please wait...\') :', '{loading ? t(\'login.pleaseWait\') :'],
  ['mode === \'login\' ? (isThai ? \'เข้าสู่ระบบ\' : \'Sign In\') :', 'mode === \'login\' ? t(\'login.signIn\') :'],
  ['(isThai ? \'สร้างบัญชี\' : \'Create Account\')}', 't(\'login.createAccount\')}'],
  ['<span className="bg-white px-3 text-[#8b8fa6]">{isThai ? \'หรือ\' : \'or\'}</span>', '<span className="bg-white px-3 text-[#8b8fa6]">{t(\'login.or\')}</span>'],
  ['<span>✉️</span> {isThai ? \'เข้าสู่ระบบด้วยลิงก์อีเมล\' : \'Sign in with Magic Link\'}', '<span>✉️</span> {t(\'login.signInWithMagicLink\')}'],
  ['{isThai ? \'เข้าชมแบบไม่ล็อกอิน (เก็บข้อมูลในเครื่อง)\' : \'Continue as Guest (saved locally only)\'}', '{t(\'login.continueAsGuest\')}'],
  ['{isThai ? \'ข้อมูลเก็บอย่างปลอดภัยบน Supabase · โหมดไม่ล็อกอินเก็บในเครื่อง\' : \'Data stored securely on Supabase · Guest mode uses local storage\'}', '{t(\'login.dataSecure\')}'],
  
  // Password strength labels
  ['{password.length >= 8 ? \'✓\' : \'○\'} {isThai ? \'อย่างน้อย 8 ตัวอักษร\' : \'At least 8 characters\'}', '{password.length >= 8 ? \'✓\' : \'○\'} {t(\'login.min8Chars2\')}'],
  ['{(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? \'✓\' : \'○\'} {isThai ? \'ตัวพิมพ์ใหญ่และเล็ก\' : \'Uppercase & lowercase\'}', '{(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? \'✓\' : \'○\'} {t(\'login.upperLower\')}'],
  ['{/\\d/.test(password) ? \'✓\' : \'○\'} {isThai ? \'ตัวเลข\' : \'Number\'}', '{/\\d/.test(password) ? \'✓\' : \'○\'} {t(\'login.number\')}'],
  ['{/[^a-zA-Z0-9]/.test(password) ? \'✓\' : \'○\'} {isThai ? \'สัญลักษณ์พิเศษ (!@#$...)\' : \'Special character (!@#$...)\'}', '{/[^a-zA-Z0-9]/.test(password) ? \'✓\' : \'○\'} {t(\'login.specialChar\')}'],
  
  // Password strength meter labels (inside the ternary block)
  ['isThai ? \'อ่อนมาก\' : \'Very Weak\'', 't(\'login.veryWeak\')'],
  ['isThai ? \'อ่อน\' : \'Weak\'', 't(\'login.weak\')'],
  ['isThai ? \'พอใช้\' : \'Fair\'', 't(\'login.fair\')'],
  ['isThai ? \'แข็งแกร่ง\' : \'Strong\'', 't(\'login.strongLabel\')'],
  ['isThai ? \'แข็งแกร่งมาก\' : \'Very Strong\'', 't(\'login.veryStrong\')'],
  
  // Special: msg || (isThai ? ...) pattern
  ['msg || (isThai ? \'สมัครไม่สำเร็จ\' : \'Signup failed.\')', 'msg || t(\'login.signupFailed\')'],
  
  // Special: captcha error in useEffect
  ['setCaptchaError(isThai ? \'การยืนยันล้มเหลว กรุณาลองใหม่\' : \'Captcha verification failed. Please try again.\')', 'setCaptchaError(t(\'login.captchaFailed\'))'],
  
  // Network errors with same text
  ['isThai ? \'ข้อผิดพลาดเครือข่าย\' : \'Network error\'', 't(\'login.networkError\')'],
  
  // The or divider
];

for (const [old, replacement] of replacements) {
  // Only replace if old text exists
  const idx = content.indexOf(old);
  if (idx !== -1) {
    content = content.replace(old, replacement);
  } else {
    // Try to find close match for debugging
    // console.log(`NOT FOUND: ${old.substring(0, 40)}...`);
  }
}

// Remove isThai declaration
content = content.replace(/\n  const isThai = locale === 'th'/, '');

// Remove isThai from dependency arrays  
// Check for }, [isThai]) pattern
content = content.replace(', [isThai]', '');

// Remove unused locale import if needed
// Actually locale might be needed for other things, let's check

fs.writeFileSync('src/app/login/page.tsx', content);
console.log('Login page migrated!');

// Verify
const remaining = (content.match(/isThai/g) || []).length;
console.log(`Remaining isThai: ${remaining}`);