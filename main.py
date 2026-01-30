import sys
import os
import webbrowser
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QHBoxLayout, QLabel, QSplashScreen)
from PyQt6.QtCore import Qt, QTimer, QUrl
from PyQt6.QtGui import QIcon, QFont, QPixmap, QColor
from PyQt6.QtWebEngineWidgets import QWebEngineView

class QuranSplashScreen(QSplashScreen):
    """شاشة ترحيب مخصصة لتطبيق الأكاديمية"""
    def __init__(self):
        # إنشاء شاشة ترحيب بقياس 800x600
        super().__init__(QPixmap(800, 600))
        
        # تعبئة الخلفية بلون فاتح
        self.pixmap().fill(QColor("#f5f7fa"))
        
        # إعداد التخطيط
        layout = QVBoxLayout()
        self.setLayout(layout)
        
        # 1. شعار الأكاديمية
        logo_label = QLabel()
        base_path = os.path.dirname(os.path.abspath(__file__))
        icon_path = os.path.join(base_path, "assets", "logo.ico")
        
        if os.path.exists(icon_path):
            pixmap = QPixmap(icon_path)
            # تحجيم الصورة مع الحفاظ على النسبة
            pixmap = pixmap.scaled(120, 120, Qt.AspectRatioMode.KeepAspectRatio, 
                                  Qt.TransformationMode.SmoothTransformation)
            logo_label.setPixmap(pixmap)
        else:
            # إذا لم توجد أيقونة، استخدم نص بديل
            logo_label.setText("🕌")
            logo_label.setFont(QFont("Arial", 48))
        
        logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addStretch()
        layout.addWidget(logo_label)
        
        # 2. عنوان الأكاديمية
        title_label = QLabel("أكاديمية Alif-Lam-Meim")
        title_label.setFont(QFont("Arial", 28, QFont.Weight.Bold))
        title_label.setStyleSheet("color: #1a5f7a;")
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # 3. وصف فرعي
        subtitle_label = QLabel("تحفيظ القرآن الكريم بالتجويد")
        subtitle_label.setFont(QFont("Arial", 16))
        subtitle_label.setStyleSheet("color: #6c757d;")
        subtitle_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(subtitle_label)
        
        # 4. رسالة التحميل
        self.loading_label = QLabel("جاري تحميل لوحة التحكم...")
        self.loading_label.setFont(QFont("Arial", 14))
        self.loading_label.setStyleSheet("color: #495057;")
        self.loading_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.loading_label)
        
        # 5. مؤشر التحميل (مبسط)
        self.progress_label = QLabel("◌")
        self.progress_label.setFont(QFont("Arial", 24))
        self.progress_label.setStyleSheet("color: #57cc99;")
        self.progress_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.progress_label)
        
        layout.addStretch()
        
        # 6. معلومات نسخة التطبيق
        version_label = QLabel("الإصدار 1.0 | © 2026 أكاديمية القرآن")
        version_label.setFont(QFont("Arial", 10))
        version_label.setStyleSheet("color: #adb5bd;")
        version_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version_label)
    
    def update_loading_text(self, text):
        """تحديث نص التحميل"""
        self.loading_label.setText(text)
        QApplication.processEvents()
    
    def animate_progress(self):
        """تحريك مؤشر التحميل"""
        current = self.progress_label.text()
        symbols = ["◌", "◎", "●", "◎"]
        idx = symbols.index(current) if current in symbols else 0
        next_idx = (idx + 1) % len(symbols)
        self.progress_label.setText(symbols[next_idx])
        QApplication.processEvents()

class QuranDashboardApp(QMainWindow):
    """التطبيق الرئيسي للوحة التحكم"""
    def __init__(self, splash):
        super().__init__()
        self.splash = splash
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("لوحة تحكم أكاديمية القرآن")
        self.setGeometry(100, 100, 1200, 800)
        
        # تعيين الأيقونة
        base_path = os.path.dirname(os.path.abspath(__file__))
        icon_path = os.path.join(base_path, "assets", "logo.ico")
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))
        
        # تحديث شاشة الترحيب
        self.splash.update_loading_text("جاري تهيئة التطبيق...")
        self.splash.animate_progress()
        
        # إنشاء متصفح ويب داخلي
        self.web_view = QWebEngineView()
        self.setCentralWidget(self.web_view)
        
        # إعداد أحداث التحميل
        self.web_view.loadStarted.connect(self.on_load_started)
        self.web_view.loadProgress.connect(self.on_load_progress)
        self.web_view.loadFinished.connect(self.on_load_finished)
        
        # بدء تحميل لوحة التحكم بعد فترة قصيرة
        QTimer.singleShot(100, self.load_dashboard)
    
    def load_dashboard(self):
        """بدء تحميل لوحة التحكم"""
        self.splash.update_loading_text("جاري الاتصال بالخادم...")
        self.splash.animate_progress()
        
        # عنوان لوحة التحكم
        dashboard_url = "https://mohamedhany2025.github.io/Alif-Lam-Meem/dashboard.html"
        self.web_view.load(QUrl(dashboard_url))
    
    def on_load_started(self):
        """عند بدء التحميل"""
        self.splash.update_loading_text("جاري تحميل لوحة التحكم...")
    
    def on_load_progress(self, progress):
        """عند تقدم التحميل"""
        self.splash.update_loading_text(f"جاري تحميل لوحة التحكم... {progress}%")
        self.splash.animate_progress()
    
    def on_load_finished(self, success):
        """عند انتهاء التحميل"""
        if success:
            self.splash.update_loading_text("تم التحميل بنجاح! جاري الانتقال...")
            self.splash.animate_progress()
            
            # الانتظار قليلاً ثم إغلاق شاشة الترحيب
            QTimer.singleShot(1500, self.show_main_window)
        else:
            self.splash.update_loading_text("فشل في التحميل! جرب فتح في المتصفح...")
            self.splash.animate_progress()
            
            # بعد 3 ثوان، حاول فتح في المتصفح الخارجي
            QTimer.singleShot(3000, self.open_in_external_browser)
    
    def show_main_window(self):
        """عرض النافذة الرئيسية وإخفاء شاشة الترحيب"""
        self.splash.finish(self)
        self.show()
        self.web_view.setFocus()
    
    def open_in_external_browser(self):
        """فتح لوحة التحكم في المتصفح الخارجي عند فشل التحميل"""
        try:
            dashboard_url = "https://tressier-subcompressed-marion.ngrok-free.dev/Web/dashboard.html"
            webbrowser.open(dashboard_url)
            
            # رسالة للمستخدم
            self.splash.update_loading_text("تم فتح المتصفح الخارجي. يتم إغلاق هذا التطبيق...")
            
            # إغلاق التطبيق بعد 2 ثانية
            QTimer.singleShot(2000, self.close_application)
        except:
            # إذا فشل فتح المتصفح
            self.splash.update_loading_text("فشل فتح المتصفح. يرجى إغلاق التطبيق يدوياً.")
    
    def close_application(self):
        """إغلاق التطبيق"""
        QApplication.quit()
    
    def closeEvent(self, event):
        """معالجة حدث إغلاق النافذة"""
        # تأكيد الإغلاق
        from PyQt6.QtWidgets import QMessageBox
        reply = QMessageBox.question(
            self, 'تأكيد الإغلاق',
            'هل تريد إغلاق لوحة التحكم؟',
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            event.accept()
        else:
            event.ignore()

def main():
    """الدالة الرئيسية لتشغيل التطبيق"""
    app = QApplication(sys.argv)
    
    # تعيين اسم التطبيق
    app.setApplicationName("أكاديمية القرآن - لوحة التحكم")
    app.setApplicationDisplayName("لوحة تحكم الأكاديمية")
    
    # تحسين العرض للنصوص العربية
    app.setFont(QFont("Arial", 10))
    
    # إنشاء وعرض شاشة الترحيب
    splash = QuranSplashScreen()
    splash.show()
    
    # تحريك مؤشر التحميل كل 500 مللي ثانية
    progress_timer = QTimer()
    progress_timer.timeout.connect(splash.animate_progress)
    progress_timer.start(500)
    
    # تحديث رسالة الترحيب
    splash.update_loading_text("بدء تشغيل التطبيق...")
    
    # إنشاء النافذة الرئيسية
    window = QuranDashboardApp(splash)
    
    # تشغيل التطبيق
    sys.exit(app.exec())

if __name__ == "__main__":
    main()