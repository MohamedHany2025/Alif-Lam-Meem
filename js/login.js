// بيانات الدخول الصحيحة (يمكن تعديلها)
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'Admin@2026'
};

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    const forgotPassword = document.getElementById('forgotPassword');
    const passwordRequirements = document.getElementById('passwordRequirements');

    // استعادة اسم المستخدم إذا كان هناك خيار "تذكرني" مفعل
    if (localStorage.getItem('rememberUsername') === 'true') {
        const savedUsername = localStorage.getItem('savedUsername');
        if (savedUsername) {
            usernameInput.value = savedUsername;
            rememberMe.checked = true;
        }
    }

    // إظهار/إخفاء كلمة المرور
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // تغيير الأيقونة
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // إظهار متطلبات كلمة المرور عند التركيز على حقل كلمة المرور
    passwordInput.addEventListener('focus', function() {
        passwordRequirements.classList.add('show');
    });

    passwordInput.addEventListener('blur', function() {
        if (this.value === '') {
            passwordRequirements.classList.remove('show');
        }
    });

    // التحقق من متطلبات كلمة المرور أثناء الكتابة
    passwordInput.addEventListener('input', function() {
        validatePasswordRequirements(this.value);
    });

    // معالجة تسجيل الدخول
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // معالجة رابط "نسيت كلمة المرور"
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        showForgotPasswordMessage();
    });
});

// دالة معالجة تسجيل الدخول
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // إخفاء الرسائل السابقة
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    // التحقق من عدم ترك الحقول فارغة
    if (!username || !password) {
        showError('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // التحقق من طول اسم المستخدم
    if (username.length < 3) {
        showError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        return;
    }

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
        showError('كلمة المرور قصيرة جداً');
        return;
    }

    // إضافة حالة التحميل
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

    // محاكاة تأخير الخادم (1 ثانية)
    setTimeout(function() {
        // التحقق من بيانات الدخول
        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            // بيانات صحيحة
            showSuccess('تم التحقق من البيانات بنجاح! جاري الانتقال...');

            // حفظ اسم المستخدم إذا كان خيار "تذكرني" مفعل
            if (rememberMe) {
                localStorage.setItem('rememberUsername', 'true');
                localStorage.setItem('savedUsername', username);
            } else {
                localStorage.setItem('rememberUsername', 'false');
                localStorage.removeItem('savedUsername');
            }

            // تعيين جلسة المستخدم
            sessionStorage.setItem('dashboardLoggedIn', 'true');
            sessionStorage.setItem('loginUsername', username);
            sessionStorage.setItem('loginTime', new Date().getTime());

            // الانتظار ثم الانتقال إلى لوحة التحكم
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // بيانات خاطئة
            showError('اسم المستخدم أو كلمة المرور غير صحيحة');
            
            // إعادة تعيين زر تسجيل الدخول
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            
            // مسح كلمة المرور
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            
            // تسجيل محاولة فاشلة
            logFailedAttempt(username);
        }
    }, 1000);
}

// دالة عرض رسالة الخطأ
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // إزالة الرسالة بعد 5 ثوان
    setTimeout(function() {
        errorMessage.classList.remove('show');
    }, 5000);
}

// دالة عرض رسالة النجاح
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.classList.add('show');
}

// دالة التحقق من متطلبات كلمة المرور
function validatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };

    // تحديث عرض المتطلبات
    const requirements_list = document.querySelectorAll('.password-requirements li');
    requirements_list[0].style.color = requirements.length ? '#28a745' : '#004085';
    requirements_list[1].style.color = requirements.uppercase ? '#28a745' : '#004085';
    requirements_list[2].style.color = requirements.lowercase ? '#28a745' : '#004085';
    requirements_list[3].style.color = requirements.number ? '#28a745' : '#004085';

    // تحديث أيقونات المتطلبات
    requirements_list[0].innerHTML = (requirements.length ? '✓ ' : '✗ ') + 'على الأقل 8 أحرف';
    requirements_list[1].innerHTML = (requirements.uppercase ? '✓ ' : '✗ ') + 'على الأقل حرف واحد كبير (A-Z)';
    requirements_list[2].innerHTML = (requirements.lowercase ? '✓ ' : '✗ ') + 'على الأقل حرف واحد صغير (a-z)';
    requirements_list[3].innerHTML = (requirements.number ? '✓ ' : '✗ ') + 'على الأقل رقم واحد (0-9)';

    return Object.values(requirements).every(req => req === true);
}

// دالة معالجة "نسيت كلمة المرور"
function showForgotPasswordMessage() {
    alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.\n\nللأسف، هذه ميزة تجريبية.\n\nاسم المستخدم: admin\nكلمة المرور: Admin@2026');
}

// دالة تسجيل محاولات الدخول الفاشلة
function logFailedAttempt(username) {
    let failedAttempts = JSON.parse(localStorage.getItem('failedAttempts') || '{}');
    
    if (!failedAttempts[username]) {
        failedAttempts[username] = [];
    }
    
    failedAttempts[username].push({
        timestamp: new Date().toLocaleString('ar-SA'),
        time: new Date().getTime()
    });
    
    localStorage.setItem('failedAttempts', JSON.stringify(failedAttempts));
    
    // التحقق من عدد محاولات الدخول الفاشلة
    if (failedAttempts[username].length >= 5) {
        // حذف المحاولات الأقدم من ساعة واحدة
        const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
        failedAttempts[username] = failedAttempts[username].filter(
            attempt => attempt.time > oneHourAgo
        );
        localStorage.setItem('failedAttempts', JSON.stringify(failedAttempts));
        
        if (failedAttempts[username].length >= 5) {
            showError('تم قفل الحساب مؤقتاً بسبب محاولات دخول متعددة فاشلة. حاول مرة أخرى بعد ساعة واحدة.');
            document.getElementById('loginForm').style.display = 'none';
            
            // إعادة تفعيل النموذج بعد ساعة
            setTimeout(function() {
                location.reload();
            }, 60 * 60 * 1000);
        }
    }
}
