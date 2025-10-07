import React, { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const palette = {
  primary: "#1F3C88",
  primaryLight: "#4E6DD8",
  secondary: "#F37021",
  accent: "#00B4D8",
  background: "#F5F7FF",
  white: "#FFFFFF",
  dark: "#1A1C2D",
  muted: "#6B7280",
};

const features = [
  {
    title: "Đăng ký & phê duyệt đề tài",
    description:
      "Quy trình chuẩn hóa giúp sinh viên đăng ký đề tài, giảng viên phản hồi và ban chủ nhiệm phê duyệt nhanh chóng.",
    icon: "📝",
  },
  {
    title: "Theo dõi tiến độ linh hoạt",
    description:
      "Bảng mốc tiến độ rõ ràng, nhắc việc tự động và báo cáo định kỳ cho từng nhóm sinh viên.",
    icon: "📊",
  },
  {
    title: "Quản lý hội đồng bảo vệ",
    description:
      "Cấu hình hội đồng theo chuẩn FIT, phân công giảng viên, xếp lịch phòng và thông báo đồng bộ.",
    icon: "🏛️",
  },
  {
    title: "Thống kê & đối soát",
    description:
      "Dashboard tổng hợp, xuất báo cáo nhanh phục vụ kiểm định chất lượng và tổng kết năm học.",
    icon: "📈",
  },
];

const timeline = [
  {
    phase: "01",
    title: "Đăng ký đề tài",
    detail:
      "Sinh viên đề xuất hoặc chọn đề tài do khoa gợi ý, giảng viên hướng dẫn xác nhận trực tuyến.",
  },
  {
    phase: "02",
    title: "Phân công hội đồng",
    detail:
      "Ban chủ nhiệm cấu hình hội đồng FIT, phân lịch bảo vệ, thông báo tới giảng viên và sinh viên.",
  },
  {
    phase: "03",
    title: "Theo dõi tiến độ",
    detail:
      "Nhật ký làm việc, mốc nộp minh chứng và phản hồi được lưu trữ tập trung, dễ truy vết.",
  },
  {
    phase: "04",
    title: "Bảo vệ & đánh giá",
    detail:
      "Ghi nhận điểm thành viên hội đồng, biên bản điện tử và xuất chứng nhận ngay sau buổi bảo vệ.",
  },
];

const roleCards = [
  {
    role: "Sinh viên",
    points: [
      "Theo dõi deadline, tải biểu mẫu chuẩn FIT",
      "Nhật ký tương tác với giảng viên hướng dẫn",
      "Nhận lịch bảo vệ, phòng và hội đồng ngay trên dashboard",
    ],
    accent: palette.accent,
  },
  {
    role: "Giảng viên",
    points: [
      "Quản lý đề tài hướng dẫn và phản biện",
      "Phê duyệt tiến độ, nhận thông báo lịch chấm",
      "Nhập điểm và nhận biên bản điện tử tức thì",
    ],
    accent: palette.secondary,
  },
  {
    role: "Ban chủ nhiệm",
    points: [
      "Cấu hình hội đồng chuẩn FIT theo học kỳ",
      "Quản lý lịch phòng, ca bảo vệ, xuất báo cáo",
      "Theo dõi số liệu tổng quan toàn khoa",
    ],
    accent: palette.primaryLight,
  },
];

const stats = [
  { label: "Đề tài đang triển khai", value: "128" },
  { label: "Giảng viên tham gia", value: "64" },
  { label: "Hội đồng bảo vệ", value: "18" },
  { label: "Minh chứng đã lưu", value: "2.430" },
];

const announcements = [
  {
    title: "Thông báo kế hoạch bảo vệ HK1 2024-2025",
    content: "Sinh viên hoàn thành nộp báo cáo tổng kết trước 17h00 ngày 05/11/2025.",
  },
  {
    title: "Cập nhật bộ biểu mẫu FIT mới",
    content: "Áp dụng từ khóa luận tốt nghiệp đợt tháng 12/2025, tải trực tiếp trên hệ thống.",
  },
];

const Home: React.FC = () => {
  const auth = useAuth();

  const renderNavAction = () => {
    if (auth.isAuthenticated) {
      return (
        <button
          onClick={() => auth.logout()}
          style={styles.nav.logoutButton}
        >
          Đăng xuất
        </button>
      );
    }

    return (
      <Link to="/login" style={styles.nav.loginButton}>
        Đăng nhập hệ thống
      </Link>
    );
  };

  return (
    <div style={styles.page.wrapper}>
      <header style={styles.header.wrapper}>
        <div style={styles.header.inner}>
          <div style={styles.header.brand}>
            <img src="/logo-ios.png" alt="Dai Nam logo" style={styles.header.logoImage} />
            <div>
              <p style={styles.header.subtitle}>Faculty of Information Technology</p>
              <h1 style={styles.header.title}>
                Hệ thống Quản lý Đăng ký & Bảo vệ Đồ án Tốt nghiệp
              </h1>
            </div>
          </div>
          <nav style={styles.nav.wrapper}>
            <a href="#features" style={styles.nav.link}>
              Tính năng
            </a>
            <a href="#workflow" style={styles.nav.link}>
              Quy trình FIT
            </a>
            <a href="#roles" style={styles.nav.link}>
              Vai trò
            </a>
            <a href="#announcements" style={styles.nav.link}>
              Thông báo
            </a>
            {renderNavAction()}
          </nav>
        </div>
      </header>

      <main style={styles.main.wrapper}>
        <section id="hero" style={styles.hero.wrapper}>
          <div style={styles.hero.backgroundShape} />
          <div style={styles.hero.inner}>
            <div style={styles.hero.content}>
              <h2 style={styles.hero.heading}>
                Kết nối sinh viên, giảng viên và ban chủ nhiệm trên một nền tảng duy nhất.
              </h2>
              <p style={styles.hero.description}>
                Được thiết kế riêng cho FIT - Đại học Đại Nam, hệ thống chuẩn hóa toàn bộ quy trình từ đăng ký đề tài, theo dõi tiến độ đến tổ chức bảo vệ, đảm bảo minh bạch và hiệu quả cho từng học kỳ.
              </p>
              <div style={styles.hero.actions}>
                <Link to="/login" style={styles.hero.primaryCta}>
                  Bắt đầu ngay
                </Link>
                <a href="#workflow" style={styles.hero.secondaryCta}>
                  Xem quy trình FIT
                </a>
              </div>
              <div style={styles.hero.meta}>
                <span>Chuẩn FIT • Áp dụng toàn khoa • Đồng bộ dữ liệu</span>
              </div>
            </div>
            <div style={styles.hero.card}>
              <div style={styles.hero.cardHeader}>
                <span style={styles.hero.badge}>FIT Dashboard</span>
                <h3 style={styles.hero.cardTitle}>Tổng quan học kỳ</h3>
              </div>
              <div style={styles.hero.cardBody}>
                {stats.slice(0, 3).map((stat) => (
                  <div key={stat.label} style={styles.hero.statItem}>
                    <p style={styles.hero.statValue}>{stat.value}</p>
                    <p style={styles.hero.statLabel}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <div style={styles.hero.cardFooter}>
                <p style={styles.hero.footerText}>
                  "Hệ thống giúp khoa kiểm soát quy trình bảo vệ nhanh gọn, minh bạch và chuẩn hóa dữ liệu."
                </p>
                <span style={styles.hero.footerCaption}>— Ban chủ nhiệm FIT</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" style={styles.features.wrapper}>
          <div style={styles.features.inner}>
            <h2 style={styles.features.title}>Tính năng nổi bật</h2>
            <p style={styles.features.description}>
              Hệ thống được trang bị nhiều tính năng ưu việt, hỗ trợ tối đa cho sinh viên và giảng viên trong quá trình quản lý đề tài và bảo vệ đồ án.
            </p>
            <div style={styles.features.grid}>
              {features.map((feature) => (
                <div key={feature.title} style={styles.features.card}>
                  <div style={styles.features.icon}>{feature.icon}</div>
                  <h3 style={styles.features.cardTitle}>{feature.title}</h3>
                  <p style={styles.features.cardDescription}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" style={styles.workflow.wrapper}>
          <div style={styles.workflow.inner}>
            <h2 style={styles.workflow.title}>Quy trình bảo vệ đồ án tốt nghiệp theo chuẩn FIT</h2>
            <div style={styles.workflow.timeline}>
              {timeline.map((item) => (
                <div key={item.title} style={styles.workflow.timelineItem}>
                  <div style={styles.workflow.timelineContent}>
                    <span style={styles.workflow.timelinePhase}>{item.phase}</span>
                    <div style={styles.workflow.timelineDetails}>
                      <h3 style={styles.workflow.timelineTitle}>{item.title}</h3>
                      <p style={styles.workflow.timelineDescription}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" style={styles.roles.wrapper}>
          <div style={styles.roles.inner}>
            <h2 style={styles.roles.title}>Vai trò trong hệ thống</h2>
            <div style={styles.roles.grid}>
              {roleCards.map((roleCard) => (
                <div key={roleCard.role} style={styles.roles.card(roleCard.accent)}>
                  <div style={styles.roles.cardHeader}>
                    <h3 style={styles.roles.cardTitle}>{roleCard.role}</h3>
                  </div>
                  <ul style={styles.roles.cardList}>
                    {roleCard.points.map((point, index) => (
                      <li key={index} style={styles.roles.cardListItem}>
                        <span style={styles.roles.bullet} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="announcements" style={styles.announcements.wrapper}>
          <div style={styles.announcements.inner}>
            <h2 style={styles.announcements.title}>Thông báo mới nhất</h2>
            <div style={styles.announcements.list}>
              {announcements.map((announcement) => (
                <div key={announcement.title} style={styles.announcements.listItem}>
                  <h3 style={styles.announcements.listTitle}>
                    {announcement.title}
                  </h3>
                  <p style={styles.announcements.listContent}>
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={styles.footer.wrapper}>
        <div style={styles.footer.inner}>
          <p style={styles.footer.text}>
            © 2023 Đại học Đại Nam - Khoa Công nghệ Thông tin. Bảo lưu mọi quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

const cs = (value: CSSProperties): CSSProperties => value;

const styles = {
  page: {
    wrapper: cs({
      fontFamily: "'Inter', system-ui, -apple-system",
      lineHeight: "1.6",
      color: palette.dark,
      backgroundColor: palette.background,
      overflowX: "hidden",
    }),
  },
  header: {
    wrapper: cs({
      position: "sticky",
      top: 0,
      zIndex: 100,
      backgroundColor: palette.white,
      boxShadow: "0 16px 40px rgba(31, 60, 136, 0.08)",
    }),
    inner: cs({
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "1.4rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "2rem",
    }),
    brand: cs({
      display: "flex",
      alignItems: "center",
      gap: "1.4rem",
    }),
    logoImage: cs({
      width: "54px",
      height: "54px",
      borderRadius: "12px",
      objectFit: "cover",
      boxShadow: "0 8px 20px rgba(31,60,136,0.12)",
    }),
    subtitle: cs({
      margin: 0,
      fontSize: "0.8rem",
      textTransform: "uppercase",
      letterSpacing: "0.22rem",
      color: palette.muted,
    }),
    title: cs({
      margin: "0.2rem 0 0",
      fontSize: "1.3rem",
      fontWeight: 700,
      color: palette.primary,
    }),
  },
  nav: {
    wrapper: cs({
      display: "flex",
      alignItems: "center",
      gap: "1.6rem",
    }),
    link: cs({
      color: palette.dark,
      fontWeight: 600,
      fontSize: "0.95rem",
      textDecoration: "none",
      position: "relative",
    }),
    loginButton: cs({
      padding: "0.65rem 1.6rem",
      borderRadius: "30px",
      background: palette.primary,
      color: palette.white,
      fontWeight: 600,
      textDecoration: "none",
      boxShadow: "0 16px 32px rgba(31, 60, 136, 0.22)",
    }),
    logoutButton: cs({
      padding: "0.6rem 1.4rem",
      borderRadius: "28px",
      border: `1px solid ${palette.primary}`,
      backgroundColor: "transparent",
      color: palette.primary,
      fontWeight: 600,
      cursor: "pointer",
    }),
  },
  main: {
    wrapper: cs({
      paddingBottom: "4rem",
    }),
  },
  hero: {
    wrapper: cs({
      position: "relative",
      overflow: "hidden",
      padding: "6rem 0 4rem",
    }),
    backgroundShape: cs({
      position: "absolute",
      inset: 0,
      background: `linear-gradient(135deg, rgba(31, 60, 136, 0.18), rgba(243, 112, 33, 0.12))`,
      maskImage:
        "radial-gradient(120% 120% at 10% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
    }),
    inner: cs({
      position: "relative",
      zIndex: 1,
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 2rem",
      display: "grid",
      gap: "3rem",
      gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
      alignItems: "center",
    }),
    content: cs({
      display: "flex",
      flexDirection: "column",
      gap: "1.6rem",
    }),
    heading: cs({
      fontSize: "2.6rem",
      lineHeight: 1.25,
      color: palette.dark,
      margin: 0,
      fontWeight: 700,
    }),
    description: cs({
      margin: 0,
      fontSize: "1.1rem",
      color: palette.muted,
      lineHeight: 1.7,
    }),
    actions: cs({
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap",
      alignItems: "center",
    }),
    primaryCta: cs({
      padding: "0.9rem 1.9rem",
      borderRadius: "999px",
      background: `linear-gradient(140deg, ${palette.primary}, ${palette.primaryLight})`,
      color: palette.white,
      fontWeight: 700,
      textDecoration: "none",
      boxShadow: "0 24px 46px rgba(31, 60, 136, 0.25)",
    }),
    secondaryCta: cs({
      padding: "0.9rem 1.9rem",
      borderRadius: "999px",
      border: `1px solid rgba(31, 60, 136, 0.25)`,
      color: palette.primary,
      fontWeight: 600,
      textDecoration: "none",
      backgroundColor: palette.white,
    }),
    meta: cs({
      fontSize: "0.9rem",
      color: palette.muted,
      textTransform: "uppercase",
      letterSpacing: "0.18rem",
    }),
    card: cs({
      backgroundColor: palette.white,
      borderRadius: "1.5rem",
      padding: "2rem",
      boxShadow: "0 22px 44px rgba(31, 60, 136, 0.15)",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
    }),
    cardHeader: cs({
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    }),
    badge: cs({
      alignSelf: "flex-start",
      padding: "0.3rem 0.9rem",
      borderRadius: "999px",
      backgroundColor: "rgba(31, 60, 136, 0.12)",
      color: palette.primary,
      fontWeight: 600,
      fontSize: "0.85rem",
      letterSpacing: "0.08rem",
    }),
    cardTitle: cs({
      margin: 0,
      fontSize: "1.4rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    cardBody: cs({
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "1rem",
    }),
    statItem: cs({
      padding: "1.2rem 1rem",
      borderRadius: "1rem",
      backgroundColor: palette.background,
      textAlign: "center",
    }),
    statValue: cs({
      margin: 0,
      fontSize: "1.6rem",
      fontWeight: 700,
      color: palette.primary,
    }),
    statLabel: cs({
      margin: "0.3rem 0 0",
      fontSize: "0.9rem",
      color: palette.muted,
    }),
    cardFooter: cs({
      borderTop: `1px solid rgba(31, 60, 136, 0.1)`,
      paddingTop: "1rem",
    }),
    footerText: cs({
      margin: 0,
      fontStyle: "italic",
      color: palette.muted,
      lineHeight: 1.6,
    }),
    footerCaption: cs({
      display: "block",
      marginTop: "0.6rem",
      color: palette.primary,
      fontWeight: 600,
      fontSize: "0.9rem",
    }),
  },
  features: {
    wrapper: cs({
      backgroundColor: palette.white,
      padding: "4rem 0",
    }),
    inner: cs({
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 2rem",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: "1.6rem",
    }),
    title: cs({
      margin: 0,
      fontSize: "2.2rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    description: cs({
      margin: 0,
      fontSize: "1rem",
      color: palette.muted,
      lineHeight: 1.6,
    }),
    grid: cs({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "1.6rem",
    }),
    card: cs({
      backgroundColor: "rgba(31, 60, 136, 0.06)",
      borderRadius: "1.2rem",
      padding: "1.8rem",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    }),
    icon: cs({
      fontSize: "2rem",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3rem",
      height: "3rem",
    }),
    cardTitle: cs({
      margin: 0,
      fontSize: "1.2rem",
      fontWeight: 700,
      color: palette.primary,
    }),
    cardDescription: cs({
      margin: 0,
      color: palette.muted,
      lineHeight: 1.6,
    }),
  },
  workflow: {
    wrapper: cs({
      background: `linear-gradient(135deg, rgba(31, 60, 136, 0.08), rgba(243, 112, 33, 0.08))`,
      padding: "4rem 0",
    }),
    inner: cs({
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 2rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
      textAlign: "center",
    }),
    title: cs({
      margin: 0,
      fontSize: "2.1rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    timeline: cs({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1.5rem",
    }),
    timelineItem: cs({
      position: "relative",
      padding: "1.8rem 1.4rem 1.4rem",
      borderRadius: "1.2rem",
      backgroundColor: palette.white,
      boxShadow: "0 12px 28px rgba(31, 60, 136, 0.12)",
    }),
    timelineContent: cs({
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }),
    timelinePhase: cs({
      fontSize: "1.5rem",
      fontWeight: 700,
      color: palette.primary,
    }),
    timelineDetails: cs({
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
    }),
    timelineTitle: cs({
      margin: 0,
      fontSize: "1.2rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    timelineDescription: cs({
      margin: 0,
      fontSize: "0.95rem",
      color: palette.muted,
      lineHeight: 1.6,
    }),
  },
  roles: {
    wrapper: cs({
      backgroundColor: palette.white,
      padding: "4rem 0",
    }),
    inner: cs({
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 2rem",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
    }),
    title: cs({
      margin: 0,
      fontSize: "2.1rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    grid: cs({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "1.5rem",
    }),
    card: (accent: string) =>
      cs({
        backgroundColor: "rgba(31, 60, 136, 0.05)",
        borderRadius: "1.4rem",
        padding: "2rem",
        textAlign: "left",
        boxShadow: "0 16px 35px rgba(31, 60, 136, 0.1)",
        borderTop: `6px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
      }),
    cardHeader: cs({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    cardTitle: cs({
      margin: 0,
      fontSize: "1.3rem",
      fontWeight: 700,
      color: palette.dark,
    }),
    cardList: cs({
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
    }),
    cardListItem: cs({
      position: "relative",
      paddingLeft: "1.6rem",
      color: palette.muted,
      lineHeight: 1.6,
    }),
    bullet: cs({
      position: "absolute",
      left: 0,
      top: "0.4rem",
      width: "0.7rem",
      height: "0.7rem",
      borderRadius: "50%",
      backgroundColor: palette.secondary,
      opacity: 0.35,
    }),
  },
  announcements: {
    wrapper: cs({
      backgroundColor: palette.background,
      padding: "4rem 0",
    }),
    inner: cs({
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "0 2rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
    }),
    title: cs({
      margin: 0,
      fontSize: "2.1rem",
      fontWeight: 700,
      color: palette.dark,
      textAlign: "center",
    }),
    grid: cs({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "1.5rem",
    }),
    card: cs({
      backgroundColor: palette.white,
      borderRadius: "1.4rem",
      padding: "2rem",
      boxShadow: "0 18px 38px rgba(31, 60, 136, 0.12)",
      display: "flex",
      flexDirection: "column",
      gap: "1.4rem",
    }),
    cardTitle: cs({
      margin: 0,
      fontSize: "1.3rem",
      fontWeight: 700,
      color: palette.primary,
    }),
    statGrid: cs({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
      gap: "1rem",
    }),
    statItem: cs({
      borderRadius: "1rem",
      backgroundColor: palette.background,
      padding: "1rem",
      textAlign: "center",
      boxShadow: "0 12px 24px rgba(31, 60, 136, 0.1)",
    }),
    statValue: cs({
      margin: 0,
      fontSize: "1.4rem",
      fontWeight: 700,
      color: palette.primary,
    }),
    statLabel: cs({
      margin: "0.3rem 0 0",
      fontSize: "0.85rem",
      color: palette.muted,
    }),
    list: cs({
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }),
    listItem: cs({
      borderRadius: "1rem",
      backgroundColor: palette.background,
      padding: "1rem 1.2rem",
      boxShadow: "0 12px 26px rgba(31, 60, 136, 0.1)",
    }),
    listTitle: cs({
      margin: 0,
      fontWeight: 700,
      color: palette.dark,
      fontSize: "1rem",
    }),
    listContent: cs({
      margin: "0.4rem 0 0",
      color: palette.muted,
      lineHeight: 1.6,
      fontSize: "0.95rem",
    }),
  },
  footer: {
    wrapper: cs({
      backgroundColor: palette.dark,
      color: "rgba(255, 255, 255, 0.7)",
    }),
    inner: cs({
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "2.2rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",
    }),
    title: cs({
      margin: 0,
      color: palette.white,
      fontSize: "1.1rem",
      fontWeight: 600,
    }),
    text: cs({
      margin: 0,
      fontSize: "0.95rem",
      lineHeight: 1.6,
    }),
  },
};

export default Home;
