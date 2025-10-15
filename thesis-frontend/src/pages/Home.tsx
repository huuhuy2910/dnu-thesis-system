import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import {
  GraduationCap,
  Users,
  FileCheck,
  BarChart3,
  Calendar,
  CheckCircle,
  User,
  BookOpen,
  Award,
  Bell,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

// Animation variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

// Data
const features = [
  {
    icon: <FileCheck className="w-8 h-8" />,
    title: "Đăng ký & phê duyệt đề tài",
    description:
      "Quy trình chuẩn hóa giúp sinh viên đăng ký đề tài, giảng viên phản hồi và ban chủ nhiệm phê duyệt nhanh chóng. Hỗ trợ upload tài liệu, theo dõi trạng thái real-time.",
    details: ["Form đăng ký trực tuyến", "Phê duyệt đa cấp", "Thông báo tự động"],
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Theo dõi tiến độ linh hoạt",
    description:
      "Bảng mốc tiến độ rõ ràng, nhắc việc tự động và báo cáo định kỳ cho từng nhóm sinh viên. Giám sát chất lượng và deadline chặt chẽ.",
    details: ["Milestone tracking", "Auto reminders", "Progress reports"],
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Quản lý hội đồng bảo vệ",
    description:
      "Cấu hình hội đồng theo chuẩn FIT, phân công giảng viên, xếp lịch phòng và thông báo đồng bộ. Đảm bảo tính công bằng và minh bạch.",
    details: ["Auto assignment", "Schedule management", "Notification system"],
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Thống kê & đối soát",
    description:
      "Dashboard tổng hợp, xuất báo cáo nhanh phục vụ kiểm định chất lượng và tổng kết năm học. Phân tích dữ liệu sâu để cải thiện quy trình.",
    details: ["Real-time dashboard", "Export reports", "Quality metrics"],
  },
];

const timelineSteps = [
  {
    phase: "01",
    icon: <BookOpen className="w-6 h-6" />,
    title: "Đăng ký đề tài",
    description:
      "Sinh viên đề xuất hoặc chọn đề tài do khoa gợi ý, giảng viên hướng dẫn xác nhận trực tuyến. Deadline rõ ràng, hỗ trợ chỉnh sửa.",
  },
  { 
    phase: "02",
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Theo dõi tiến độ",
    description:
      "Nhật ký làm việc, mốc nộp minh chứng và phản hồi được lưu trữ tập trung, dễ truy vết. Giám sát liên tục từ xa.",
  },
  {
    phase: "03",
    icon: <Calendar className="w-6 h-6" />,
    title: "Phân công hội đồng",
    description:
      "Ban chủ nhiệm cấu hình hội đồng FIT, phân lịch bảo vệ, thông báo tới giảng viên và sinh viên. Tự động tránh xung đột lịch.",
  },
  {
    phase: "04",
    icon: <Award className="w-6 h-6" />,
    title: "Bảo vệ & đánh giá",
    description:
      "Ghi nhận điểm thành viên hội đồng, biên bản điện tử và xuất chứng nhận ngay sau buổi bảo vệ. Lưu trữ vĩnh viễn.",
  },
];

const roles = [
  {
    icon: <User className="w-8 h-8" />,
    role: "Sinh viên",
    color: "border-secondary",
    points: [
      "Theo dõi deadline, tải biểu mẫu chuẩn FIT",
      "Nhật ký tương tác với giảng viên hướng dẫn",
      "Nhận lịch bảo vệ, phòng và hội đồng ngay trên dashboard",
      "Upload tài liệu, nhận phản hồi real-time",
    ],
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    role: "Giảng viên",
    color: "border-primary",
    points: [
      "Quản lý đề tài hướng dẫn và phản biện",
      "Phê duyệt tiến độ, nhận thông báo lịch chấm",
      "Nhập điểm và nhận biên bản điện tử tức thì",
      "Theo dõi thống kê cá nhân và khoa",
    ],
  },
  {
    icon: <Users className="w-8 h-8" />,
    role: "Ban chủ nhiệm",
    color: "border-secondary",
    points: [
      "Cấu hình hội đồng chuẩn FIT theo học kỳ",
      "Quản lý lịch phòng, ca bảo vệ, xuất báo cáo",
      "Theo dõi số liệu tổng quan toàn khoa",
      "Phê duyệt đề tài và giám sát quy trình",
    ],
  },
];

const stats = [
  { value: "128", label: "Đề tài đang triển khai", icon: <FileCheck className="w-5 h-5" /> },
  { value: "64", label: "Giảng viên tham gia", icon: <Users className="w-5 h-5" /> },
  { value: "18", label: "Hội đồng bảo vệ", icon: <Award className="w-5 h-5" /> },
  { value: "2.430", label: "Minh chứng đã lưu", icon: <BarChart3 className="w-5 h-5" /> },
];

const announcements = [
  {
    title: "Thông báo kế hoạch bảo vệ HK1 2024-2025",
    content: "Sinh viên hoàn thành nộp báo cáo tổng kết trước 17h00 ngày 05/11/2025. Hội đồng sẽ bắt đầu từ tuần sau.",
    date: "07/10/2025",
  },
  {
    title: "Cập nhật bộ biểu mẫu FIT mới",
    content: "Áp dụng từ khóa luận tốt nghiệp đợt tháng 12/2025, tải trực tiếp trên hệ thống. Bao gồm form mới cho bảo vệ.",
    date: "05/10/2025",
  },
  {
    title: "Hướng dẫn sử dụng hệ thống mới",
    content: "Video tutorial và tài liệu hướng dẫn đã được cập nhật. Sinh viên vui lòng xem trước khi đăng ký đề tài.",
    date: "03/10/2025",
  },
];

// Components
const Brand: React.FC<{ showBrand: boolean }> = ({ showBrand }) => (
  <motion.div
    className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300 ${showBrand ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    initial={{ y: 0, opacity: 1 }}
    animate={{ y: showBrand ? 0 : -100, opacity: showBrand ? 1 : 0 }}
  >
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/fitdnu_logo.png"
            alt="Dai Nam University"
            className="h-10 w-auto"
          />
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Faculty of Information Technology - FIT
          </div>
        </div>
        <div className="text-sm font-bold text-primary">
          Hệ thống Quản lý Đăng ký & Bảo vệ Đồ án Tốt nghiệp
        </div>
      </div>
    </div>
  </motion.div>
);

const Nav: React.FC<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  showBrand: boolean;
}> = ({ isMobileMenuOpen, setIsMobileMenuOpen, showBrand }) => {
  const auth = useAuth();

  const renderNavAction = () => {
    if (auth.isAuthenticated) {
      return (
        <button
          onClick={() => auth.logout()}
          className="px-4 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
        >
          Đăng xuất
        </button>
      );
    }
    return (
      <Link
        to="/login"
        className="px-4 py-2 bg-secondary text-white rounded-full font-semibold hover:bg-secondary/90 transition-colors"
      >
        Đăng nhập hệ thống
      </Link>
    );
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-all duration-300 ${showBrand ? "mt-16" : "mt-0"
        } ${!showBrand ? "shadow-soft" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/logo-ios.png"
              alt="FIT System"
              className="h-8 w-auto"
            />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-primary font-semibold hover:text-secondary transition-colors">
              Tính năng
            </a>
            <a href="#workflow" className="text-primary font-semibold hover:text-secondary transition-colors">
              Quy trình FIT
            </a>
            <a href="#roles" className="text-primary font-semibold hover:text-secondary transition-colors">
              Vai trò
            </a>
            <a href="#announcements" className="text-primary font-semibold hover:text-secondary transition-colors">
              Thông báo
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">{renderNavAction()}</div>
            <button
              className="md:hidden p-2 text-primary ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden bg-white border-t border-gray-200 max-h-[60vh] overflow-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="px-4 py-4 space-y-4">
            <a href="#features" className="block text-primary font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              Tính năng
            </a>
            <a href="#workflow" className="block text-primary font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              Quy trình FIT
            </a>
            <a href="#roles" className="block text-primary font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              Vai trò
            </a>
            <a href="#announcements" className="block text-primary font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              Thông báo
            </a>
            {renderNavAction()}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

const Home: React.FC = () => {
  const [showBrand, setShowBrand] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBrand(window.scrollY < 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-mist">
      <Brand showBrand={showBrand} />
      <Nav isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} showBrand={showBrand} />

      <main className={`${showBrand ? 'pt-8 md:pt-10 lg:pt-12' : 'pt-6 md:pt-8 lg:pt-10'}`}>
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight">
  Hệ thống quản lý đồ án tốt nghiệp – kết nối mọi vai trò FIT.
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Được thiết kế riêng cho FIT - Đại học Đại Nam, hệ thống chuẩn hóa toàn bộ quy trình từ đăng ký đề tài, theo dõi tiến độ đến tổ chức bảo vệ, đảm bảo minh bạch và hiệu quả cho từng học kỳ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-secondary text-white rounded-full font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-soft"
                >
                  Bắt đầu ngay
                </Link>
                <a
                  href="#workflow"
                  className="px-8 py-4 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Xem quy trình FIT
                </a>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 uppercase tracking-wide">
                <span>Chuẩn FIT</span>
                <span>•</span>
                <span>Áp dụng toàn khoa</span>
                <span>•</span>
                <span>Đồng bộ dữ liệu</span>
              </div>
            </motion.div>

            <motion.div variants={fadeLeft} className="bg-white rounded-2xl p-8 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span className="text-sm font-semibold text-primary">FIT Dashboard</span>
                </div>
                <h3 className="text-xl font-bold text-primary">Tổng quan học kỳ</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-mist rounded-xl p-4 text-center"
                    variants={fadeUp}
                  >
                    <div className="flex items-center justify-center mb-2 text-secondary">
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-600 italic mb-2">
                  "Hệ thống giúp khoa kiểm soát quy trình bảo vệ nhanh gọn, minh bạch và chuẩn hóa dữ liệu."
                </p>
                <p className="text-primary font-semibold text-sm">— Ban chủ nhiệm FIT</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Tính năng nổi bật
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
              Hệ thống được trang bị nhiều tính năng ưu việt, hỗ trợ tối đa cho sinh viên và giảng viên trong quá trình quản lý đề tài và bảo vệ đồ án.
            </motion.p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-mist rounded-2xl p-6 hover:shadow-soft transition-shadow duration-300"
                  variants={fadeUp}
                >
                  <div className="text-secondary mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="text-left space-y-1">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <ChevronRight className="w-4 h-4 text-secondary mr-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-secondary/5">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Quy trình bảo vệ đồ án tốt nghiệp theo chuẩn FIT
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12"
              variants={staggerContainer}
            >
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-soft relative"
                  variants={fadeLeft}
                >
                  <div className="absolute -top-4 left-6 bg-secondary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    {step.phase}
                  </div>
                  <div className="mt-6">
                    <div className="text-secondary mb-3">{step.icon}</div>
                    <h3 className="text-xl font-bold text-primary mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Roles Section */}
        <section id="roles" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Vai trò trong hệ thống
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
              variants={staggerContainer}
            >
              {roles.map((role, index) => (
                <motion.div
                  key={index}
                  className={`bg-mist rounded-2xl p-8 border-t-4 ${role.color} hover:shadow-soft transition-shadow duration-300`}
                  variants={fadeUp}
                >
                  <div className="text-secondary mb-4">{role.icon}</div>
                  <h3 className="text-2xl font-bold text-primary mb-6">{role.role}</h3>
                  <ul className="space-y-3 text-left">
                    {role.points.map((point, i) => (
                      <li key={i} className="flex items-start text-gray-600">
                        <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Announcements Section */}
        <section id="announcements" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-mist">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Thông báo mới nhất</h2>
              <p className="text-lg text-gray-600">Cập nhật kịp thời các thông tin quan trọng từ khoa FIT</p>
            </motion.div>
            <motion.div className="space-y-6" variants={staggerContainer}>
              {announcements.map((announcement, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-subtle transition-shadow duration-300"
                  variants={fadeUp}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-6 h-6 text-secondary" />
                      <h3 className="text-xl font-bold text-primary">{announcement.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{announcement.date}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{announcement.content}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img src="/dnu_logo.png" alt="Dai Nam University" className="h-10 w-auto" />
            <div>
              <p className="font-bold">Đại học Đại Nam</p>
              <p className="text-secondary">Khoa Công nghệ Thông tin</p>
            </div>
          </div>
          <p className="text-gray-300">© 2025 Đại học Đại Nam - Khoa Công nghệ Thông tin. Bảo lưu mọi quyền.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
