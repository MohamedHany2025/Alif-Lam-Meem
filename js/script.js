// أكاديمية Alif-Lam-Meيم - كود JavaScript النهائي
// تفعيل التنقل للموبايل
document.addEventListener('DOMContentLoaded', function() {
    // 1. تفعيل القائمة المنسدلة
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (hamburger) hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // 2. متغيرات JSONBin - استبدل هذه بالقيم الحقيقية الخاصة بك
    const JSONBIN_BIN_ID = '697c129dae596e708f02274d'; // معرف الحاوية
    const JSONBIN_API_KEY = '$2a$10$EVEgnKcuZEoujGa1B3HQmuU7C3Eh6NfJFdYR9IH0r1mQR3UAc2SU2'; // مفتاحك السري
    const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b'; // رابط API الأساسي
    
    // رابط كامل للحاوية الخاصة بك
    const JSONBIN_URL = `${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`;
    
    // 3. توليد رقم طلب فريد
    function generateApplicationId() {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ALM-${timestamp}${randomNum}`;
    }
    
    // 4. الدالة الأساسية لحفظ البيانات في JSONBin
    async function submitApplication(formData) {
        console.log('بدء عملية الإرسال إلى JSONBin...');
        
        try {
            // الخطوة 1: جلب البيانات الحالية من JSONBin
            console.log('جاري جلب البيانات الحالية...');
            const getResponse = await fetch(JSONBIN_URL, {
                method: 'GET',
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!getResponse.ok) {
                throw new Error(`فشل في جلب البيانات: ${getResponse.status}`);
            }
            
            const jsonData = await getResponse.json();
            console.log('بيانات JSONBin المستلمة:', jsonData);
            
            // الحصول على مصفوفة التقديمات الحالية أو إنشاء مصفوفة جديدة
            let applications = [];
            if (jsonData.record && Array.isArray(jsonData.record.applications)) {
                applications = jsonData.record.applications;
            } else if (jsonData.record && typeof jsonData.record === 'object') {
                // إذا كان السجل موجودًا ولكن ليس فيه مصفوفة applications، نبدأ بمصفوفة جديدة
                applications = [];
            }
            
            // الخطوة 2: إنشاء كائن التقديم الجديد
            const newApplication = {
                id: generateApplicationId(),
                date: new Date().toISOString(),
                ...formData
            };
            
            applications.push(newApplication);
            
            // الخطوة 3: تحديث البيانات في JSONBin
            console.log('جاري تحديث البيانات في JSONBin...');
            const updateResponse = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY,
                    'Content-Type': 'application/json',
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify({
                    "applications": applications  // إرسال مصفوفة التقديمات المحدثة
                })
            });
            
            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`فشل في حفظ البيانات: ${updateResponse.status} - ${errorText}`);
            }
            
            const updateResult = await updateResponse.json();
            console.log('تم الحفظ بنجاح:', updateResult);
            
            return { success: true, applicationId: newApplication.id };
            
        } catch (error) {
            console.error('حدث خطأ في submitApplication:', error);
            return { 
                success: false, 
                error: error.message || 'حدث خطأ غير معروف'
            };
        }
    }
    
    // 5. التعامل مع تقديم النموذج
    const applicationForm = document.getElementById('applicationForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.querySelector('.close-modal');
    const applicationId = document.getElementById('applicationId');
    
    if (applicationForm) {
        applicationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // جمع بيانات النموذج
            const formData = {
                fullName: document.getElementById('fullName').value.trim(),
                age: document.getElementById('age').value,
                country: document.getElementById('country').value.trim(),
                sessions: document.getElementById('sessions').value,
                phone: document.getElementById('phone').value.trim(),
                courseType: document.querySelector('input[name="courseType"]:checked')?.value,
                notes: document.getElementById('notes').value.trim()
            };
            
            // التحقق من البيانات المطلوبة
            if (!formData.courseType) {
                alert('الرجاء اختيار نوع الدورة (تجويد وقرآن أو قرآن فقط)');
                return;
            }
            
            // عرض حالة التحميل
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            submitBtn.disabled = true;
            
            try {
                // استدعاء دالة حفظ البيانات
                console.log('جاري إرسال البيانات:', formData);
                const result = await submitApplication(formData);
                
                if (result.success) {
                    // عرض رسالة النجاح
                    applicationId.textContent = result.applicationId;
                    successModal.style.display = 'flex';
                    
                    // إعادة تعيين النموذج
                    applicationForm.reset();
                    
                    console.log('تم حفظ التقديم بنجاح. رقم الطلب:', result.applicationId);
                } else {
                    // عرض رسالة الخطأ
                    alert(`عذراً، حدث خطأ في إرسال البيانات:\n${result.error}`);
                    console.error('فشل في حفظ البيانات:', result.error);
                }
            } catch (error) {
                console.error('خطأ غير متوقع:', error);
                alert('حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.');
            } finally {
                // إعادة تعيين الزر
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // 6. إغلاق النافذة المنبثقة
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            successModal.style.display = 'none';
        });
    }
    
    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
    
    // 7. نموذج الاتصال (وظيفة أساسية بدون حفظ)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const contactName = document.getElementById('contactName').value;
            const contactEmail = document.getElementById('contactEmail').value;
            const contactMessage = document.getElementById('contactMessage').value;
            
            // هنا يمكنك إضافة كود لإرسال رسالة الاتصال
            alert(`شكراً ${contactName || 'للمستخدم'}، تم استلام رسالتك. سنقوم بالرد عليك في أقرب وقت ممكن.`);
            
            // إعادة تعيين النموذج
            contactForm.reset();
        });
    }
    
    // 8. التنقل السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    console.log('تم تحميل script.js بنجاح');
});
// 9. نسخ رقم الطلب إلى الحافظة
document.addEventListener('DOMContentLoaded', function() {
    const copyButton = document.getElementById('copyButton');
    const applicationIdSpan = document.getElementById('applicationId');
    if (copyButton && applicationIdSpan) {
        copyButton.addEventListener('click', function() {
            const applicationId = applicationIdSpan.textContent;
            navigator.clipboard.writeText(applicationId).then(function() {
                alert('تم نسخ رقم الطلب إلى الحافظة: ' + applicationId);
            }, function(err) {
                console.error('فشل في نسخ رقم الطلب: ', err);
});});}});