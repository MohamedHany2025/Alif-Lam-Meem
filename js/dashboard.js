// إعدادات JSONBin للوحة التحكم
const JSONBIN_BIN_ID = '697c129dae596e708f02274d'; // استبدل هذا بمعرف الـ Bin الخاص بك
const JSONBIN_API_KEY = '$2a$10$EVEgnKcuZEoujGa1B3HQmuU7C3Eh6NfJFdYR9IH0r1mQR3UAc2SU2'; // استبدل هذا بمفتاح API الخاص بك
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// متغيرات عامة
let allApplications = [];
let filteredApplications = [];
let currentPage = 1;
const itemsPerPage = 10;

// ========== نظام التحقق من جلسة المستخدم ==========

// دالة التحقق من جلسة المستخدم
function checkSession() {
    const loggedIn = sessionStorage.getItem('dashboardLoggedIn');
    const username = sessionStorage.getItem('loginUsername');
    const loginTime = sessionStorage.getItem('loginTime');
    
    // إذا لم يكن المستخدم مسجلاً دخول، أعده إلى صفحة تسجيل الدخول
    if (loggedIn !== 'true' || !username || !loginTime) {
        window.location.href = 'login.html';
        return false;
    }
    
    // التحقق من انقضاء الجلسة (24 ساعة)
    const currentTime = new Date().getTime();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 ساعة
    
    if (currentTime - parseInt(loginTime) > sessionTimeout) {
        // انتهت الجلسة، أعد المستخدم إلى صفحة تسجيل الدخول
        sessionStorage.clear();
        alert('انتهت جلسة عملك. يرجى تسجيل الدخول مرة أخرى.');
        window.location.href = 'login.html';
        return false;
    }
    
    // عرض اسم المستخدم
    document.getElementById('currentUsername').textContent = username;
    
    return true;
}

// دالة تسجيل الخروج
function logout() {
    const confirmed = confirm('هل تريد بالفعل تسجيل الخروج؟');
    if (confirmed) {
        // مسح بيانات الجلسة
        sessionStorage.clear();
        
        // الانتقال إلى صفحة تسجيل الدخول
        window.location.href = 'login.html';
    }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من جلسة المستخدم أولاً
    if (!checkSession()) {
        return;
    }
    
    // إضافة مستمع لزر تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // تفعيل شريط التنقل للأجهزة المحمولة
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        hamburger.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // جلب البيانات من JSONBin
    fetchApplications();
    
    // إضافة مستمعي الأحداث
    document.getElementById('refreshBtn').addEventListener('click', function() {
        fetchApplications();
        fetchMessages();
    });
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('searchInput').addEventListener('keyup', applyFilters);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('printTable').addEventListener('click', printTable);
    document.getElementById('prevPage').addEventListener('click', goToPrevPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close-modal, .close-details-modal, .close-nodata-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارج المحتوى
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // إضافة مستمعي الأحداث للرسائل
    document.getElementById('applyMessagesFilter').addEventListener('click', applyMessagesFilter);
    document.getElementById('resetMessagesFilter').addEventListener('click', resetMessagesFilter);
    document.getElementById('searchMessages').addEventListener('keyup', applyMessagesFilter);
    document.getElementById('exportMessagesCSV').addEventListener('click', exportMessagesToCSV);
    document.getElementById('prevMessagesPage').addEventListener('click', goToPrevMessagesPage);
    document.getElementById('nextMessagesPage').addEventListener('click', goToNextMessagesPage);
    
    // جلب الرسائل من JSONBin
    setTimeout(() => fetchMessages(), 500);
});

// دالة جلب البيانات من JSONBin
async function fetchApplications() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dataSourceStatus = document.getElementById('dataSourceStatus');
    
    loadingIndicator.style.display = 'block';
    dataSourceStatus.textContent = 'جارٍ جلب البيانات...';
    dataSourceStatus.style.color = '#ffc107';
    
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب البيانات: ${response.status}`);
        }
        
        const data = await response.json();
        
        // استخراج قائمة الطلبات
        allApplications = data.record && data.record.applications ? data.record.applications : [];
        
        if (allApplications.length === 0) {
            // إذا لم توجد بيانات، عرض نافذة منبثقة
            document.getElementById('noDataModal').style.display = 'flex';
            dataSourceStatus.textContent = 'لا توجد بيانات';
            dataSourceStatus.style.color = '#dc3545';
        } else {
            dataSourceStatus.textContent = 'متصل - البيانات محدثة';
            dataSourceStatus.style.color = '#28a745';
            
            // تحديث الوقت الأخير للتحديث
            const now = new Date();
            document.getElementById('lastUpdated').textContent = 
                `${now.toLocaleDateString('ar-SA')} ${now.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        // تطبيق الفلاتر الحالية
        applyFilters();
        
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        dataSourceStatus.textContent = 'خطأ في الاتصال';
        dataSourceStatus.style.color = '#dc3545';
        
        // عرض رسالة خطأ للمستخدم
        alert('عذراً، حدث خطأ في جلب البيانات من السيرفر. يرجى المحاولة مرة أخرى.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// دالة تطبيق الفلاتر
function applyFilters() {
    const courseFilter = document.getElementById('filterCourse').value;
    const sessionsFilter = document.getElementById('filterSessions').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    // تطبيق الفلاتر
    filteredApplications = allApplications.filter(app => {
        // فلترة نوع الدورة
        if (courseFilter !== 'all' && app.courseType !== courseFilter) {
            return false;
        }
        
        // فلترة عدد الحصص
        if (sessionsFilter !== 'all' && app.sessions !== sessionsFilter) {
            return false;
        }
        
        // فلترة البحث
        if (searchQuery && 
            !app.fullName.toLowerCase().includes(searchQuery) && 
            !app.country.toLowerCase().includes(searchQuery)) {
            return false;
        }
        
        return true;
    });
    
    // تحديث الإحصائيات
    updateStatistics();
    
    // إعادة تعيين الصفحة الحالية
    currentPage = 1;
    
    // تحديث الجدول
    updateApplicationsTable();
    
    // تحديث معلومات الصفحة
    updatePaginationInfo();
}

// دالة إعادة تعيين الفلاتر
function resetFilters() {
    document.getElementById('filterCourse').value = 'all';
    document.getElementById('filterSessions').value = 'all';
    document.getElementById('searchInput').value = '';
    
    applyFilters();
}

// دالة تحديث الإحصائيات
function updateStatistics() {
    const total = filteredApplications.length;
    
    // حساب الإحصائيات
    const tajweedCount = filteredApplications.filter(app => app.courseType === 'تجويد وقرآن').length;
    const quranOnlyCount = filteredApplications.filter(app => app.courseType === 'قرآن فقط').length;
    
    // حساب متوسط الحصص
    const totalSessions = filteredApplications.reduce((sum, app) => sum + parseInt(app.sessions || 0), 0);
    const avgSessions = total > 0 ? (totalSessions / total).toFixed(1) : 0;
    
    // تحديث واجهة المستخدم
    document.getElementById('totalApplications').textContent = total;
    document.getElementById('tajweedCount').textContent = tajweedCount;
    document.getElementById('quranOnlyCount').textContent = quranOnlyCount;
    document.getElementById('avgSessions').textContent = avgSessions;
}

// دالة تحديث الجدول
function updateApplicationsTable() {
    const tableBody = document.getElementById('applicationsTableBody');
    
    if (filteredApplications.length === 0) {
        tableBody.innerHTML = `
            <tr class="no-data-message">
                <td colspan="9">
                    <i class="fas fa-database"></i>
                    <h3>لا توجد طلبات تطابق معايير البحث</h3>
                    <p>جرب تغيير الفلاتر أو قم بتحديث البيانات.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // حساب مؤشرات الصفحة
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredApplications.length);
    const pageApplications = filteredApplications.slice(startIndex, endIndex);
    
    // بناء صفوف الجدول
    let tableHTML = '';
    
    pageApplications.forEach((app, index) => {
        const rowIndex = startIndex + index + 1;
        
        // تنسيق التاريخ
        const appDate = app.date ? new Date(app.date) : new Date();
        const formattedDate = appDate.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // تقصير الملاحظات إذا كانت طويلة
        const shortNotes = app.notes && app.notes.length > 30 
            ? app.notes.substring(0, 30) + '...' 
            : app.notes || 'لا توجد';
        
        tableHTML += `
            <tr data-app-id="${app.id}">
                <td>${app.id || 'غير متوفر'}</td>
                <td>${app.fullName || 'غير معروف'}</td>
                <td>${app.age || 'غير محدد'}</td>
                <td>${app.country || 'غير محدد'}</td>
                <td>${app.sessions || '0'} حصة</td>
                <td dir="ltr">${app.phone || 'غير متوفر'}</td>
                <td>
                    <span class="course-badge ${app.courseType === 'تجويد وقرآن' ? 'tajweed-badge' : 'quran-badge'}">
                        ${app.courseType || 'غير محدد'}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td>${shortNotes}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
    
    // إضافة مستمعي الأحداث للصفوف
    document.querySelectorAll('#applicationsTableBody tr[data-app-id]').forEach(row => {
        row.addEventListener('click', function() {
            const appId = this.getAttribute('data-app-id');
            showApplicationDetails(appId);
        });
    });
    
    // تحديث معلومات الإدخالات
    document.getElementById('currentEntries').textContent = `${startIndex + 1}-${endIndex}`;
    document.getElementById('totalEntries').textContent = filteredApplications.length;
}

// دالة عرض تفاصيل الطلب
function showApplicationDetails(appId) {
    const application = allApplications.find(app => app.id === appId);
    
    if (!application) {
        alert('تعذر العثور على تفاصيل الطلب');
        return;
    }
    
    // تنسيق التاريخ
    const appDate = application.date ? new Date(application.date) : new Date();
    const formattedDate = appDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // تعبئة البيانات في النافذة المنبثقة
    document.getElementById('detailId').textContent = application.id || 'غير متوفر';
    document.getElementById('detailName').textContent = application.fullName || 'غير معروف';
    document.getElementById('detailAge').textContent = application.age || 'غير محدد';
    document.getElementById('detailCountry').textContent = application.country || 'غير محدد';
    document.getElementById('detailSessions').textContent = `${application.sessions || '0'} حصة أسبوعياً`;
    document.getElementById('detailPhone').textContent = application.phone || 'غير متوفر';
    document.getElementById('detailCourseType').textContent = application.courseType || 'غير محدد';
    document.getElementById('detailDate').textContent = formattedDate;
    document.getElementById('detailNotes').textContent = application.notes || 'لا توجد ملاحظات';
    
    // عرض النافذة المنبثقة
    document.getElementById('applicationModal').style.display = 'flex';
}

// دالة تحديث معلومات الترقيم
function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    
    // تحديث معلومات الصفحة
    document.getElementById('pageInfo').textContent = `الصفحة ${currentPage} من ${totalPages}`;
    
    // تفعيل/تعطيل أزرار الترقيم
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// دالة الانتقال للصفحة السابقة
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateApplicationsTable();
        updatePaginationInfo();
    }
}

// دالة الانتقال للصفحة التالية
function goToNextPage() {
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        updateApplicationsTable();
        updatePaginationInfo();
    }
}

// دالة التصدير إلى CSV
function exportToCSV() {
    if (filteredApplications.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }
    
    // تحديد العناوين
    const headers = [
        'رقم الطلب',
        'الاسم الرباعي', 
        'العمر',
        'البلد',
        'الحصص أسبوعياً',
        'رقم الهاتف',
        'نوع الدورة',
        'تاريخ التقديم',
        'ملاحظات'
    ];
    
    // بناء محتوى CSV
    let csvContent = headers.join(',') + '\n';
    
    filteredApplications.forEach(app => {
        const row = [
            `"${app.id || ''}"`,
            `"${app.fullName || ''}"`,
            `"${app.age || ''}"`,
            `"${app.country || ''}"`,
            `"${app.sessions || ''}"`,
            `"${app.phone || ''}"`,
            `"${app.courseType || ''}"`,
            `"${app.date ? new Date(app.date).toLocaleDateString('ar-SA') : ''}"`,
            `"${(app.notes || '').replace(/"/g, '""')}"`
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    // إنشاء ملف وتنزيله
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `طلبات_الأكاديمية_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// دالة طباعة الجدول
function printTable() {
    if (filteredApplications.length === 0) {
        alert('لا توجد بيانات للطباعة');
        return;
    }
    
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    // بناء محتوى HTML للطباعة
    let printHTML = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طلبات الأكاديمية - ${new Date().toLocaleDateString('ar-SA')}</title>
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 20px; }
                h1 { color: #1a5f7a; text-align: center; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #1a5f7a; color: white; padding: 12px; text-align: right; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .header-info { margin-bottom: 20px; text-align: center; }
                .footer-info { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h1>طلبات أكاديمية Alif-Lam-Meem</h1>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                <p>إجمالي الطلبات: ${filteredApplications.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>رقم الطلب</th>
                        <th>الاسم الرباعي</th>
                        <th>العمر</th>
                        <th>البلد</th>
                        <th>الحصص/أسبوع</th>
                        <th>رقم الهاتف</th>
                        <th>نوع الدورة</th>
                        <th>تاريخ التقديم</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // إضافة صفوف البيانات
    filteredApplications.forEach(app => {
        const appDate = app.date ? new Date(app.date) : new Date();
        const formattedDate = appDate.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        printHTML += `
            <tr>
                <td>${app.id || 'غير متوفر'}</td>
                <td>${app.fullName || 'غير معروف'}</td>
                <td>${app.age || 'غير محدد'}</td>
                <td>${app.country || 'غير محدد'}</td>
                <td>${app.sessions || '0'} حصة</td>
                <td>${app.phone || 'غير متوفر'}</td>
                <td>${app.courseType || 'غير محدد'}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    });
    
    printHTML += `
                </tbody>
            </table>
            
            <div class="footer-info">
                <p>أكاديمية Alif-Lam-Meem - تحفيظ القرآن الكريم بالتجويد</p>
                <p>المديرة: أ. سارة بحيري - هاتف: +20 10 6833 9196</p>
                <p>تم إنشاء هذا التقرير تلقائياً من لوحة التحكم</p>
            </div>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #1a5f7a; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    طباعة التقرير
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    إغلاق النافذة
                </button>
            </div>
        </body>
        </html>
    `;
    
    // كتابة المحتوى وفتح نافذة الطباعة
    printWindow.document.write(printHTML);
    printWindow.document.close();
}

// أضف هذه الأنماط الإضافية لتحسين المظهر
const additionalStyles = `
    .course-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
    }
    
    .tajweed-badge {
        background-color: var(--secondary-color);
    }
    
    .quran-badge {
        background-color: var(--primary-color);
    }
    
    #applicationsTableBody tr {
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    #applicationsTableBody tr:hover {
        background-color: #e8f4fc !important;
    }
`;

// حذف الطلب
document.getElementById('delete-application-btn').addEventListener('click', function() {
    const appId = document.getElementById('detailId').textContent;
    if (confirm(`هل أنت متأكد من حذف الطلب رقم ${appId}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        // حذف الطلب من allApplications
        allApplications = allApplications.filter(app => app.id !== appId);
        
        // جلب الرسائل الموجودة للحفاظ عليها
        fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(jsonData => {
            let messages = [];
            if (jsonData.record && Array.isArray(jsonData.record.messages)) {
                messages = jsonData.record.messages;
            }
            
            // تحديث البيانات في JSONBin
            return fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    applications: allApplications,
                    messages: messages 
                })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`خطأ في تحديث البيانات: ${response.status}`);
            }
            return response.json();
        }
        )
        .then(data => {
            console.log('تم تحديث البيانات بنجاح:', data);
        })
        .catch(error => {
            console.error('خطأ في تحديث البيانات:', error);
            alert('حدث خطأ أثناء تحديث البيانات على السيرفر. يرجى المحاولة مرة أخرى.');
        });
        // إعادة تطبيق الفلاتر وتحديث الجدول
        applyFilters();
        // إغلاق النافذة المنبثقة
        document.getElementById('applicationModal').style.display = 'none';
        alert(`تم حذف الطلب رقم ${appId} بنجاح.`);
    }
)};

// تأكيد الطلب
document.getElementById('conform-application-btn').addEventListener('click', function() {
    const appId = document.getElementById('detailId').textContent;
    alert(`تم تأكيد الطلب رقم ${appId} بنجاح.`);
    // حذف الطلب من allApplications
    allApplications = allApplications.filter(app => app.id !== appId);
    
    // جلب الرسائل الموجودة للحفاظ عليها
    fetch(JSONBIN_URL, {
        method: 'GET',
        headers: {
            'X-Master-Key': JSONBIN_API_KEY,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(jsonData => {
        let messages = [];
        if (jsonData.record && Array.isArray(jsonData.record.messages)) {
            messages = jsonData.record.messages;
        }
        
        // تحديث البيانات في JSONBin
        return fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                applications: allApplications,
                messages: messages 
            })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطأ في تحديث البيانات: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('تم تحديث البيانات بنجاح:', data);
    })
    .catch(error => {
        console.error('خطأ في تحديث البيانات:', error);
        alert('حدث خطأ أثناء تحديث البيانات على السيرفر. يرجى المحاولة مرة أخرى.');
    });
    // إعادة تطبيق الفلاتر وتحديث الجدول
    applyFilters();
    // إغلاق النافذة المنبثقة
    document.getElementById('applicationModal').style.display = 'none';
    alert(`تم تأكيد الطلب رقم ${appId} بنجاح.`);
});

// إضافة الأنماط إلى الصفحة
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

// ========== ========== نظام إدارة الرسائل الإلكترونية ========== ==========

let allMessages = [];
let filteredMessages = [];
let currentMessagesPage = 1;
const messagesPerPage = 10;

// دالة جلب الرسائل من JSONBin
async function fetchMessages() {
    const loadingIndicator = document.getElementById('messagesLoadingIndicator');
    loadingIndicator.style.display = 'block';
    
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب الرسائل: ${response.status}`);
        }
        
        const data = await response.json();
        
        // استخراج قائمة الرسائل
        allMessages = data.record && data.record.messages ? data.record.messages : [];
        
        // تطبيق الفلاتر الحالية
        applyMessagesFilter();
        
    } catch (error) {
        console.error('خطأ في جلب الرسائل:', error);
        alert('عذراً، حدث خطأ في جلب الرسائل من السيرفر.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// دالة تطبيق فلاتر الرسائل
function applyMessagesFilter() {
    const searchQuery = document.getElementById('searchMessages').value.toLowerCase();
    
    filteredMessages = allMessages.filter(msg => {
        if (searchQuery && 
            !msg.contactName.toLowerCase().includes(searchQuery) && 
            !msg.contactEmail.toLowerCase().includes(searchQuery)) {
            return false;
        }
        return true;
    });
    
    currentMessagesPage = 1;
    updateMessagesTable();
    updateMessagesPaginationInfo();
}

// دالة إعادة تعيين فلاتر الرسائل
function resetMessagesFilter() {
    document.getElementById('searchMessages').value = '';
    applyMessagesFilter();
}

// دالة تحديث جدول الرسائل
function updateMessagesTable() {
    const tableBody = document.getElementById('messagesTableBody');
    
    if (filteredMessages.length === 0) {
        tableBody.innerHTML = `
            <tr class="no-data-message">
                <td colspan="6">
                    <i class="fas fa-envelope-open"></i>
                    <h3>لا توجد رسائل</h3>
                    <p>لم تصل أي رسائل جديدة حتى الآن.</p>
                </td>
            </tr>
        `;
        
        document.getElementById('currentMessages').textContent = '0';
        document.getElementById('totalMessages').textContent = '0';
        return;
    }
    
    // حساب مؤشرات الصفحة
    const startIndex = (currentMessagesPage - 1) * messagesPerPage;
    const endIndex = Math.min(startIndex + messagesPerPage, filteredMessages.length);
    const pageMessages = filteredMessages.slice(startIndex, endIndex);
    
    // تحديث معلومات العدد
    document.getElementById('currentMessages').textContent = endIndex;
    document.getElementById('totalMessages').textContent = filteredMessages.length;
    
    // بناء صفوف الجدول
    let tableHTML = '';
    
    pageMessages.forEach((msg, index) => {
        // تنسيق التاريخ
        const msgDate = msg.date ? new Date(msg.date) : new Date();
        const formattedDate = msgDate.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // تقصير الرسالة
        const shortMessage = msg.contactMessage && msg.contactMessage.length > 40 
            ? msg.contactMessage.substring(0, 40) + '...' 
            : msg.contactMessage || 'لا توجد';
        
        tableHTML += `
            <tr data-msg-id="${msg.id}">
                <td>${msg.id || 'غير متوفر'}</td>
                <td>${msg.contactName || 'غير معروف'}</td>
                <td dir="ltr">${msg.contactEmail || 'غير متوفر'}</td>
                <td>${shortMessage}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn-view-message" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
    
    // إضافة مستمعي الأحداث
    document.querySelectorAll('#messagesTableBody tr[data-msg-id]').forEach(row => {
        row.addEventListener('click', function() {
            const msgId = this.getAttribute('data-msg-id');
            const message = allMessages.find(msg => msg.id === msgId);
            
            if (message) {
                showMessageDetails(message);
            }
        });
    });
}

// دالة عرض تفاصيل الرسالة
function showMessageDetails(message) {
    const modal = document.getElementById('messageModal');
    
    // تعبئة البيانات
    document.getElementById('messageDetailId').textContent = message.id || 'غير متوفر';
    document.getElementById('messageDetailName').textContent = message.contactName || 'غير معروف';
    document.getElementById('messageDetailEmail').textContent = message.contactEmail || 'غير متوفر';
    document.getElementById('messageDetailContent').textContent = message.contactMessage || 'لا توجد رسالة';
    
    const msgDate = message.date ? new Date(message.date) : new Date();
    const formattedDate = msgDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('messageDetailDate').textContent = formattedDate;
    
    // عرض النافذة
    modal.style.display = 'flex';
    
    // إضافة مستمع لزر الحذف
    const deleteBtn = document.getElementById('delete-message-btn');
    deleteBtn.onclick = function() {
        deleteMessage(message.id);
    };
}

// دالة حذف الرسالة
async function deleteMessage(msgId) {
    const confirmed = confirm('هل تريد حذف هذه الرسالة؟ هذا الإجراء لا يمكن التراجع عنه.');
    if (!confirmed) return;
    
    try {
        // جلب البيانات الحالية
        const getResponse = await fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const jsonData = await getResponse.json();
        
        let applications = jsonData.record && jsonData.record.applications ? jsonData.record.applications : [];
        let messages = jsonData.record && jsonData.record.messages ? jsonData.record.messages : [];
        
        // حذف الرسالة
        messages = messages.filter(msg => msg.id !== msgId);
        
        // تحديث البيانات
        const updateResponse = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                applications: applications,
                messages: messages
            })
        });
        
        if (!updateResponse.ok) {
            throw new Error('فشل في حذف الرسالة');
        }
        
        alert('تم حذف الرسالة بنجاح');
        document.getElementById('messageModal').style.display = 'none';
        fetchMessages();
        
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        alert('حدث خطأ في حذف الرسالة.');
    }
}

// دالة تحديث معلومات التقسيم للرسائل
function updateMessagesPaginationInfo() {
    const totalPages = Math.max(1, Math.ceil(filteredMessages.length / messagesPerPage));
    document.getElementById('messagesPageInfo').textContent = `الصفحة ${currentMessagesPage} من ${totalPages}`;
    
    // تفعيل/تعطيل أزرار التنقل
    document.getElementById('prevMessagesPage').disabled = currentMessagesPage === 1;
    document.getElementById('nextMessagesPage').disabled = currentMessagesPage === totalPages;
}

// دالة الانتقال للصفحة السابقة للرسائل
function goToPrevMessagesPage() {
    if (currentMessagesPage > 1) {
        currentMessagesPage--;
        updateMessagesTable();
        updateMessagesPaginationInfo();
    }
}

// دالة الانتقال للصفحة التالية للرسائل
function goToNextMessagesPage() {
    const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
    if (currentMessagesPage < totalPages) {
        currentMessagesPage++;
        updateMessagesTable();
        updateMessagesPaginationInfo();
    }
}

// دالة تصدير الرسائل كـ CSV
function exportMessagesToCSV() {
    if (filteredMessages.length === 0) {
        alert('لا توجد رسائل للتصدير');
        return;
    }
    
    // إنشاء رؤوس الأعمدة
    const headers = ['رقم الرسالة', 'الاسم', 'البريد الإلكتروني', 'الرسالة', 'تاريخ الإرسال'];
    
    // إنشاء صفوف البيانات
    const rows = filteredMessages.map(msg => {
        const msgDate = new Date(msg.date);
        const formattedDate = msgDate.toLocaleDateString('ar-SA') + ' ' + 
                            msgDate.toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'});
        
        return [
            msg.id || '',
            msg.contactName || '',
            msg.contactEmail || '',
            `"${(msg.contactMessage || '').replace(/"/g, '""')}"`,
            formattedDate
        ];
    });
    
    // إنشاء محتوى CSV
    let csvContent = '\uFEFF'; // BOM للدعم الكامل للعربية
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    csvContent += rows.map(row => row.join(',')).join('\n');
    
    // إنشاء وتحميل الملف
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `رسائل_الأكاديمية_${new Date().toLocaleDateString('ar-SA')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}})});
